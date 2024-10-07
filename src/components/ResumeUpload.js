import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8001/api';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [matchScore, setMatchScore] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (['pdf', 'docx'].includes(fileExtension)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a PDF or DOCX file.');
      setFile(null);
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post(`${API_URL}/parse-resume/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setParsedData(response.data.parsed_data);
      setError(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error uploading file. Please try again.');
    }
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleJobMatch = async (e) => {
    e.preventDefault();
    if (!jobDescription) {
      setError('Please enter a job description.');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/match-job/`, { job_description: jobDescription });
      setMatchScore(response.data.match_score);
      setError(null);
    } catch (error) {
      console.error('Error matching job:', error);
      setError('Error matching job. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      <form onSubmit={handleResumeSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="resume">
            Upload Resume (PDF or DOCX)
          </label>
          <input
            type="file"
            id="resume"
            onChange={handleFileChange}
            accept=".pdf,.docx"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Parse Resume
        </button>
      </form>

      {parsedData && (
        <div className="mt-4 mb-8">
          <h2 className="text-xl font-bold mb-2">Parsed Resume Data:</h2>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(parsedData, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleJobMatch} className="mb-8">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="jobDescription">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={handleJobDescriptionChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="4"
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Match Job
        </button>
      </form>

      {matchScore !== null && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Match Score:</h2>
          <p className="text-2xl font-bold text-blue-600">{(matchScore * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;