import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import logo from "./logo.svg";

function App() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("http://127.0.0.1:8000/interpret-lab-results/", formData);
    setResults(response.data.results);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>AI-Based Medical Dashboard</h1>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>

        {results.length > 0 && (
          <div>
            <h2>Lab Results Interpretation</h2>
            <ul>
              {results.map((res, index) => (
                <li key={index}>
                  <strong>{res.Test}:</strong> {res.Explanation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
