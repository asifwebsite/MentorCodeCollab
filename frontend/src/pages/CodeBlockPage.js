import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import AceEditor from 'react-ace';
import loaderGif from '../assets/spinner.gif';
import correctSmiley from '../assets/correctSmiley.jpeg'
import wrongSmiley from '../assets/wrongSmiley.jpg'



import 'ace-builds/src-noconflict/mode-javascript'; // Import the mode for the syntax you need
import 'ace-builds/src-noconflict/theme-monokai'; // Import the theme you want

import '../styles/CodeBlockPage.css';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001';

const CodeBlockPage = () => {
    const { id } = useParams();
    const [role, setRole] = useState('');
    const [codeBlock, setCodeBlock] = useState({});
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultGif, setResultGif] = useState('');


    const socket = useMemo(() => io(SOCKET_URL), []);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        if (role === 'student') {
            socket.emit('codeChange', newCode, id);
        }
    };

    const fetchCodeBlock = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${API_URL}/api/codeblocks/${id}`);
            setCodeBlock(response.data);
            setCode(response.data.code);
        } catch (err) {
            console.error('Error fetching code block:', err);
            setError('Failed to fetch code block');
        } finally {
            setLoading(false);
        }
    };

    const normalizeWhitespace = (text) => {
        return text
            .replace(/\s*\(\s*/g, '(') // Remove spaces around opening parentheses
            .replace(/\s*\)\s*/g, ')') // Remove spaces around closing parentheses
            .replace(/\s+/g, ' ')      // Replace all other sequences of whitespace with a single space
            .trim();
    };

    const extractUserSolution = () => {
        const startMarker = "//Your solution starts here:";
        const endMarker = "// Your solution Ends here";
        const startIndex = code.indexOf(startMarker);
        const endIndex = code.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
            return '';
        }
        const userSolution = code.substring(startIndex + startMarker.length, endIndex);
        return normalizeWhitespace(userSolution);
    };

    const compareSolution = () => {
        const userSolution = extractUserSolution();
        const isCorrect = userSolution === normalizeWhitespace(codeBlock.solution);

        // Emit result to all clients in the room
        socket.emit('solutionChecked', { roomId: id, isCorrect });

        // Also show the result on the current client
        showResultGif(isCorrect ? correctSmiley : wrongSmiley);
    };

    const showResultGif = (gifName) => {
        setResultGif(gifName);
        setTimeout(() => {
            setResultGif('');
        }, 5000); // Hide the GIF after 5 seconds
    };

    useEffect(() => {
        fetchCodeBlock();
    }, [id]);

    useEffect(() => {
        socket.emit('joinRoom', id);

        socket.on('role', (assignedRole) => {
            setRole(assignedRole);
        });

        socket.on('codeUpdate', (updatedCode) => {
            setCode(updatedCode);
        });

        socket.on('solutionChecked', (data) => {
            showResultGif(data.isCorrect ? correctSmiley : wrongSmiley);
        });

        return () => {
            socket.off('role');
            socket.off('codeUpdate');
            socket.off('solutionChecked');
        };
    }, [socket, id]);

    return (
        <>
            {loading ? (
                <img src={loaderGif} alt="Loading..." className="loader" />
            ) : error ? (
                <div>Error: {error}</div>
            ) : (
                <div className="codeblock-container">
                    <h2 className="codeblock-title">{codeBlock.title}</h2>
                    <h3 className={`codeblock-role-${role}`}>{role}</h3>
                    <AceEditor
                        mode="javascript"
                        theme="monokai"
                        name="codeEditor"
                        value={code}
                        onChange={handleCodeChange}
                        readOnly={role !== 'student'}
                        fontSize={14}
                        showPrintMargin={true}
                        showGutter={true}
                        highlightActiveLine={true}
                        setOptions={{
                            useWorker: false,
                            showLineNumbers: true,
                            tabSize: 2,
                        }}
                        style={{ width: '60%', height: '350px' }}
                    />
                    {role === 'student' && (
                        <button className='submit-button' onClick={compareSolution} disabled={loading}>
                            Submit Solution
                        </button>
                    )}
                    {resultGif && (
                        <div className="centered-image-container">
                            <img src={resultGif} alt="Result" />
                        </div>
                    )}
                </div>

            )}
        </>
    );
};

export default CodeBlockPage;
