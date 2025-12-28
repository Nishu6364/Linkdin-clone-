import React, { useState, useContext } from 'react';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';
import dp from "../assets/dp.webp";
import ChatButton from './ChatButton';
import ConnectionButton from './ConnectionButton';

const UserSearch = () => {
    const { serverUrl } = useContext(authDataContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const searchUsers = async () => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        try {
            const response = await axios.get(`${serverUrl}/api/user/search?query=${encodeURIComponent(searchQuery)}`, {
                withCredentials: true
            });
            setSearchResults(response.data);
            setHasSearched(true);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        searchUsers();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchUsers();
        }
    };

    return (
        <div className="w-full max-w-[600px] mx-auto">
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex items-center bg-white rounded-lg shadow-md border">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search for people..."
                        className="flex-1 px-4 py-3 text-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-[#0073b1] text-white rounded-r-lg hover:bg-[#005885] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {/* Search Results */}
            {hasSearched && (
                <div className="bg-white rounded-lg shadow-md">
                    {loading ? (
                        <div className="p-6 text-center text-gray-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <div>
                            <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">
                                Found {searchResults.length} people
                            </div>
                            {searchResults.map((user, index) => (
                                <div key={index} className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-[60px] h-[60px] rounded-full overflow-hidden">
                                                <img
                                                    src={user.profileImage || dp}
                                                    alt={`${user.firstName} ${user.lastName}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800">
                                                    {`${user.firstName} ${user.lastName}`}
                                                </div>
                                                {user.headline && (
                                                    <div className="text-gray-600 text-sm">
                                                        {user.headline}
                                                    </div>
                                                )}
                                                {user.location && (
                                                    <div className="text-gray-500 text-sm">
                                                        {user.location}
                                                    </div>
                                                )}
                                                <div className="text-gray-400 text-xs">
                                                    {user.connection?.length || 0} connections
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <ChatButton 
                                                userId={user._id} 
                                                userName={`${user.firstName} ${user.lastName}`}
                                                className="px-4 py-2 bg-[#0073b1] text-white rounded-md text-sm hover:bg-[#005885]"
                                            />
                                            <ConnectionButton 
                                                userId={user._id}
                                                userName={`${user.firstName} ${user.lastName}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No users found for "{searchQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSearch;
