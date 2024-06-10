import React, { useState, useEffect } from 'react';

const CountDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const URL_STRING_ASISTENCIA = 'https://894bdij9ij.execute-api.us-east-1.amazonaws.com/licco/paseasistenciadiario/7/0';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(URL_STRING_ASISTENCIA);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const countOccurrences = (data, value) => {
    return data.reduce((acc, record) => {
      return record.horas === value ? acc + 1 : acc;
    }, 0);
  };

  return (
    <div>
      <h2>Count Dashboard</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Retardo</td>
            <td>{countOccurrences(data, 'Y')}</td>
          </tr>
          <tr>
            <td>F</td>
            <td>{countOccurrences(data, 'F')}</td>
          </tr>
          <tr>
            <td>INC</td>
            <td>{countOccurrences(data, 'INC')}</td>
          </tr>
          <tr>
            <td>V</td>
            <td>{countOccurrences(data, 'V')}</td>
          </tr>
          <tr>
            <td>FJ</td>
            <td>{countOccurrences(data, 'FJ')}</td>
          </tr>
          <tr>
            <td>HO</td>
            <td>{countOccurrences(data, 'HO')}</td>
          </tr>
          <tr>
            <td>EJ</td>
            <td>{countOccurrences(data, 'EJ')}</td>
          </tr>
          <tr>
            <td>SJ</td>
            <td>{countOccurrences(data, 'SJ')}</td>
          </tr>
          <tr>
            <td>S</td>
            <td>{countOccurrences(data, 'S')}</td>
          </tr>
          <tr>
            <td>CAP</td>
            <td>{countOccurrences(data, 'CAP')}</td>
          </tr>
          <tr>
            <td>PC/G</td>
            <td>{countOccurrences(data, 'PC/G')}</td>
          </tr>
          <tr>
            <td>PS/G</td>
            <td>{countOccurrences(data, 'PS/G')}</td>
          </tr>
          <tr>
            <td>PH</td>
            <td>{countOccurrences(data, 'PH')}</td>
          </tr>
          <tr>
            <td>D</td>
            <td>{countOccurrences(data, 'D')}</td>
          </tr>
          <tr>
            <td>FI</td>
            <td>{countOccurrences(data, 'FI')}</td>
          </tr>
          <tr>
            <td>C</td>
            <td>{countOccurrences(data, 'C')}</td>
          </tr>
          <tr>
            <td>AUS</td>
            <td>{countOccurrences(data, 'AUS')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CountDashboard;
