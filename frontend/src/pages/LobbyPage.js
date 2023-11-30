import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/LobbyPage.css'
import '../styles/LoaderWheel.css'
import loaderGif from '../assets/spinner.gif';


const API_URL = "https://mentor-code-collab.onrender.com"


const LobbyPage = () => {
    const [codeBlocks, setCodeBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchCodeBlocks = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await axios.get(`${API_URL}/api/codeblocks`);
            setCodeBlocks(response.data);
        } catch (error) {
            setError('Error fetching code blocks');
            console.error('Error fetching code blocks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodeBlocks();
    }, []);

    return (
        <div className="lobby-container">
            <h1 className="title">Choose Code Block</h1>
            <div>
                {loading ? (
                    <img src={loaderGif} alt="Loading..." className="loader" />
                ) : error ? (
                    <div>Error: {error}</div>
                ) : (
                    codeBlocks.map(block => (
                        <Link key={block._id} to={`/codeblock/${block._id}`}>
                            <div className="code-block">
                                {block.title}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default LobbyPage;