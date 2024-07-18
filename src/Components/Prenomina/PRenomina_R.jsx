import React, { useState, useEffect, useRef } from 'react';
import 'tabulator-tables/dist/css/tabulator.min.css';
import 'flatpickr/dist/flatpickr.min.css';
import Flatpickr from 'flatpickr';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import * as XLSX from 'xlsx';
import Spinner from '../Spinner/Spinner';
import './Prenomina.css';

const PrenominaR = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(false);

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  useEffect(() => {
    Flatpickr(startDateRef.current, {
      dateFormat: 'Y-m-d',
      onChange: ([date]) => setStartDate(date.toISOString().split('T')[0]),
    });
    Flatpickr(endDateRef.current, {
      dateFormat: 'Y-m-d',
      onChange: ([date]) => setEndDate(date.toISOString().split('T')[0]),
    });
  }, []);

  const handleFetchData = async () => {
    setLoading(true);
    const { transformedData, columns } = await fetchData(startDate, endDate);
    if (table) {
      table.setData(transformedData);
      table.setColumns(columns);
    } else {
      const newTable = new Tabulator('#data-table', {
        data: transformedData,
        layout: 'fitDataStretch',
        columns: columns,
        height: 500,
        cellVertAlign: 'middle', // Align content vertically to center
        cellHozAlign: 'center',  // Align content horizontally to center
      });
      setTable(newTable);
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    setLoading(true);
    const { transformedData, columns } = await fetchData(startDate, endDate);
    const downloadableData = transformedData.map((row, index) => {
      const newRow = { 'Consecutive Number': index + 1 };
      columns.forEach(col => {
        newRow[col.title] = row[col.field];
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(downloadableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const dataUri = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    const link = document.createElement('a');
    const downloadName = `${transformedData[0]?.contract_name || 'data'}_${startDate}-${endDate}`;
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${dataUri}`;
    link.download = `${downloadName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  const fetchData = async (startDate, endDate) => {
    const baseUrl = 'https://894bdij9ij.execute-api.us-east-1.amazonaws.com/licco/asistencias/';
    const url = `${baseUrl}${startDate}/${endDate}/7`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return transformData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      return { transformedData: [], columns: [] };
    }
  };

  const transformData = (data) => {
    const pivotData = {};
    const dates = new Set();
    let countMap = {};

    data.forEach((item) => {
      if (!pivotData[item.nombre]) {
        pivotData[item.nombre] = {
          nombre: item.nombre,
          contract_name: item.contract_name,
          Site: 'XOLA',
          'ID Nominas': item.employee_number,
          PUESTO: 'RAC',
          TURNO: determineTurno(item.horas), // Determine TURNO here
          fechadeinicio: item.fechadeinicio || '',
          fechabaja: item.fechabaja || '-',
          horario: item.horas || '',
          jornada: calculateJornada(item.horas), // Calculate jornada here
        };
      }

      let horasValue = item.hora;
      if (horasValue === 'F') {
        horasValue = 'FI';
      } else if (horasValue === 'Dom' || horasValue === 'Sab') {
        horasValue = 'D';
      } else if (/[\d]/.test(horasValue)) {
        horasValue = item.retardo === "Y" ? 'R' : 'A';
      }
      pivotData[item.nombre][item.fecha] = horasValue;
      dates.add(item.fecha);

      if (['FI', 'B', 'INC', 'AA', 'SUS'].includes(horasValue)) {
        if (!countMap[item.nombre]) {
          countMap[item.nombre] = 0;
        }
        countMap[item.nombre]++;
      }
    });

    // Filter out rows where every horasValue between the dates is "B"
    const filteredData = Object.values(pivotData).filter(item => {
      const horasValuesInRange = Array.from(dates).map(date => item[date]).filter(Boolean);
      return !horasValuesInRange.every(value => value === 'B');
    });

    const transformedData = filteredData.map((item, index) => ({
      consecutiveNumber: index + 1,
      ...item,
      Last_Column: 15 - (countMap[item.nombre] || 0),
    }));

    const columns = [
      { title: '#', field: 'consecutiveNumber', frozen: true, width: 50 },
      { title: 'Contract Name', field: 'contract_name', frozen: true, width: 90 },
      { title: 'Site', field: 'Site', frozen: true, width: 90 },
      { title: 'ID Nominas', field: 'ID Nominas', frozen: true, width: 90 },
      { title: 'PUESTO', field: 'PUESTO', frozen: true, width: 90 },
      { title: 'Nombre', field: 'nombre', frozen: true, width: 140 },
      { title: 'TURNO', field: 'TURNO', width: 90 },
      { title: 'Fecha de Ingreso', field: 'fechadeinicio', width: 90 },
      { title: 'Fecha de Baja', field: 'fechabaja', width: 90 },
      { title: 'Jornada', field: 'jornada', width: 90 },
      { title: 'Horario', field: 'horario', width: 90 }
    ];

    dates.forEach(date => {
      columns.push({ title: date, field: date, headerVertical: true, align: 'center' });
    });

    columns.push({ title: 'Dias Trabajados', field: 'Last_Column', align: 'center' });

    return { transformedData, columns };
  };

  // Helper function to calculate jornada
  const calculateJornada = (horas) => {
    if (!horas || typeof horas !== 'string') return '';

    const [start, end] = horas.split('-');
    if (!start || !end) return '';

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const startTime = new Date(0, 0, 0, startHour, startMinute, 0);
    const endTime = new Date(0, 0, 0, endHour, endMinute, 0);

    let diff = (endTime - startTime) / 1000 / 60 / 60; // Difference in hours
    if (diff < 0) diff += 24; // Adjust for cases where end time is past midnight

    return diff.toFixed(2); // Return jornada as a string with two decimal places
  };

  // Helper function to determine TURNO
  const determineTurno = (horas) => {
    if (!horas || typeof horas !== 'string') return '';

    const [start] = horas.split('-');
    if (!start) return '';

    const [startHour] = start.split(':').map(Number);

    return startHour < 13 ? 'Matutino' : 'Vespertino';
  };

  return (
    <div>
      <h2>Formato de Prenomina</h2>
      <div className="col6">
        <label htmlFor="start-date">Fecha Inicio:</label>
        <input type="text" id="start-date" ref={startDateRef} />
      </div>
      <div className="col6">
        <label htmlFor="end-date">Fecha Fin:</label>
        <input type="text" id="end-date" ref={endDateRef} />
      </div>
      <button id="fetch-data" className="waves-effect waves-light btn-small" onClick={handleFetchData}>Generar</button>
      {loading && <Spinner />}
      <div id="data-table"></div>
      <button id="download-xls" className="waves-effect waves-light btn-small" onClick={handleDownload}>Descargar Excel</button>
    </div>
  );
};

export default PrenominaR;
