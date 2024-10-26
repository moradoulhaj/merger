import React, { useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  const [oldFiles, setOldFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [mergedContents, setMergedContents] = useState([]);
  const [step, setStep] = useState(1);

  const oldFileInputRef = useRef(null);
  const newFileInputRef = useRef(null);

  const handleOldFileUpload = (event) => {
    const uploadedOldFiles = Array.from(event.target.files);
    setOldFiles(uploadedOldFiles);
  };

  const handleNewFileUpload = (event) => {
    const uploadedNewFiles = Array.from(event.target.files);
    setNewFiles(uploadedNewFiles);
  };

  const mergeFiles = () => {
    const readFileContent = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    };

    const fileMerges = newFiles.map((newFile) => {
      const match = newFile.name.match(/file_(\d+)/);
      const newIndex = match ? parseInt(match[1]) : -1;
      const oldIndex = newIndex + step;
      const oldFile = oldFiles.find((file) => {
        const oldMatch = file.name.match(/file_(\d+)/);
        return oldMatch && parseInt(oldMatch[1]) === oldIndex;
      });

      if (!oldFile) {
        toast.error(`Missing old file at index ${oldIndex}. Merging process stopped.`);
        throw new Error(`Missing old file at index ${oldIndex}`);
      }

      return readFileContent(oldFile).then(oldContent => 
        readFileContent(newFile).then(newContent => ({
          name: oldFile.name,
          content: oldContent + "\n" + newContent, // Overwrite old file with new content
        }))
      );
    });

    Promise.all(fileMerges)
      .then((results) => {
        setMergedContents(results);
        // Update old files state to reflect the merged content
        const updatedOldFiles = oldFiles.map((file) => {
          const mergedFile = results.find(result => result.name === file.name);
          return mergedFile ? { name: mergedFile.name, content: mergedFile.content } : { name: file.name, content: "" }; // Initialize with empty content
        });
        setOldFiles(updatedOldFiles);
      })
      .catch((error) => console.error("Error reading files:", error));
  };

  const downloadMergedContent = () => {
    const allFilesToDownload = oldFiles.map((file) => {
        const mergedFile = mergedContents.find(result => result.name === file.name);
        return {
            name: file.name,
            content: mergedFile ? mergedFile.content : "", // Set to empty if no change
        };
    });
    
    allFilesToDownload.forEach(({ name, content }) => {
        // If content is empty, keep the original content from oldFiles
        const originalFile = oldFiles.find(original => original.name === name);
        const finalContent = content === "" && originalFile ? originalFile.content : content;

        const blob = new Blob([finalContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();

        URL.revokeObjectURL(url);
    });
};

  return (
    <div className="flex flex-col items-center p-8 space-y-4 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h2 className="text-2xl font-bold text-gray-800">
        Merge Old and New Text Files
      </h2>

      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <input
            type="file"
            accept=".txt"
            multiple
            ref={oldFileInputRef}
            onChange={handleOldFileUpload}
            style={{ display: "none" }}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => oldFileInputRef.current.click()}
          >
            Upload Old Files
          </button>
        </div>

        <div>
          <input
            type="file"
            accept=".txt"
            multiple
            ref={newFileInputRef}
            onChange={handleNewFileUpload}
            style={{ display: "none" }}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={() => newFileInputRef.current.click()}
          >
            Upload New Files
          </button>
        </div>
      </div>

      <div>
        <label className="text-gray-700">
          Enter the step value (e.g., 3 for merging new file_1 with old file_4):
        </label>
        <input
          type="number"
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          className="border rounded px-2 py-1 ml-2"
          min="1"
        />
      </div>

      <div className="flex justify-between gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-700">
            Uploaded Old Files:
          </h3>
          <ul>
            {oldFiles.map((file, index) => (
              <li key={index} className="text-gray-600">
                {file.name}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-700">
            Uploaded New Files:
          </h3>
          <ul>
            {newFiles.map((file, index) => (
              <li key={index} className="text-gray-600">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        onClick={mergeFiles}
      >
        Merge Files
      </button>
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        onClick={downloadMergedContent}
        disabled={!mergedContents.length}
      >
        Download Merged Files
      </button>
    </div>
  );
}
