import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';
import dp from "../assets/dp.webp";
import { FaRegCheckCircle } from "react-icons/fa";
import { RxCrossCircled } from "react-icons/rx";
function Network() {
    let { serverUrl } = useContext(authDataContext);
    let [connection, setConnection] = useState([]);
    let { userData } = useContext(userDataContext);

    const handleGetRequests = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/connection/requests`, { withCredentials: true });
            setConnection(result.data);
        }
        catch (error) {
            console.error("Error fetching connection requests:", error);
        }
    }

    const handleAcceptConnection = async (requestId) => {

        try{
            let result = await axios.put(`${serverUrl}/api/connection/accept/${ requestId }`, {},{ withCredentials: true });
            setConnection(connection.filter((con) => con._id !==requestId))
            // console.log("Connection accepted:", result.data);
        }
        catch(error){
            console.log("Error accepting connection:", error);
        }
    }
    const handleRejectConnection = async (requestId) => {

        try{
            let result = await axios.put(`${serverUrl}/api/connection/reject/${ requestId }`,{}, { withCredentials: true });
            setConnection(connection.filter((con) => con._id !== requestId))
            // console.log("Connection accepted:", result.data);
        }
        catch(error){
            console.log("Error rejecting connection:", error);
        }
    }

    useEffect(() => {
        handleGetRequests();
    }, []);

    return (
        <div className="w-screen  h-[100vh] bg-bg-[#f0efe7] pt-[100px] px-[20px] flex flex-col   gap-[40px] item-center  ">
            <Nav />
            <div className='w-full h-[100px] bg-[white] shadow-lg rounded-lg flex  p-[10px] text-[22px] text-gray-600'>
                Invitations {connection.length}
            </div>

            {connection.length > 0 &&
                <div className="w-[100%] max-w-[900px] mx-auto shadow-lg rounded-lg flex-col gap-[20px] min-h[100px]">




                    {connection.map((connection, index) => (
                        <div className="w-full min-h-[100px] flex justify-between item-center">
                            <div className='flex justify-start items-center gap-[10px]'>
                                <div className="w-[60px] h-[60px] rounded-full overflow-hidden cursor-pointer justify-center items-center">
                                    <img
                                        src={connection.sender?.profileImage || dp}
                                        alt=""
                                        className="w-full h-f ull"
                                    />
                                </div>
                                <div className="text-[19px] font-semibold text-gray-700">{`${connection.sender.firstName} ${connection.sender.lastName}`}</div>
                            </div>
                            <div className='flex gap-2'>
                                <button className='text-[#18c5ff] font-semibold' onClick={()=>handleAcceptConnection(connection._id)}><FaRegCheckCircle className='w-[40px] h-[40px] ' /></button>
                                <button className='text-[#ff4d4f] font-semibold' onClick={()=>handleRejectConnection(connection._id)}><RxCrossCircled className='w-[40px] h-[40px]' /></button>
                            </div>

                        </div>






                    ))}


                </div>}

        </div>





    );
}

export default Network;