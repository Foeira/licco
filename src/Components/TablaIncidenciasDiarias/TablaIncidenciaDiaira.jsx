import React from 'react';

class EditInciFalta extends React.Component {
  editInciFalta = () => {
    const { id, val, nombre } = this.props;
    let jo = {};
    let dataArray = [];

    console.log("value " + id);

    if (id !== '') {
      const URL_STRING = "https://894bdij9ij.execute-api.us-east-1.amazonaws.com/licco/incidencias/masivas";
      let record = {
        numempleado: id.toString(),
        nombre: nombre,
        contract_code: "ACH002",
        client_id: "1",
        contract_name: "Corporativo licco",
        incidencia: val,
      };
      dataArray.push(record);
    }

    jo.incidencias = dataArray;
    let result = JSON.stringify(jo);

    let options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: result,
    };

    console.log("JSON: " + result);

    fetch(URL_STRING, options)
      .then(response => response.text())
      .then(text => console.log(text))
      .catch(error => console.error('Error:', error));
  };

  render() {
    return (
      <div>
        <button onClick={this.editInciFalta}>Edit InciFalta</button>
      </div>
    );
  }
}

export default EditInciFalta;