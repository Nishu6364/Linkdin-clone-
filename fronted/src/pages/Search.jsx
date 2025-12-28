import React from 'react';
import Nav from '../components/Nav';
import UserSearch from '../components/UserSearch';

function Search() {
    return (
        <div className="w-screen min-h-[100vh] bg-[#f0efe7] pt-[100px] px-[20px] flex flex-col items-center">
            <Nav />
            
            <div className='w-full max-w-[900px]'>
                <div className='w-full bg-white shadow-lg rounded-lg flex items-center justify-center p-[20px] mb-[30px]'>
                    <h1 className='text-[24px] text-gray-700 font-semibold'>Find People to Connect & Message</h1>
                </div>
                
                <UserSearch />
            </div>
        </div>
    );
}

export default Search;
