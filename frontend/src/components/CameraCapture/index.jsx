import React, { useRef, useState, useEffect } from 'react';
import { FaCamera, FaTimes } from 'react-icons/fa';

const CameraCapture = ({ onCapture, onCancel }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let currentStream = null;

        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } 
                });
                setStream(mediaStream);
                currentStream = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Unable to access camera. Please check permissions.");
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            canvas.toBlob((blob) => {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
                onCapture(file);
            }, 'image/jpeg', 0.8);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700"
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="relative bg-black rounded-lg overflow-hidden flex flex-col items-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 md:h-96 object-cover"
            />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 items-center">
                <button
                    onClick={onCancel}
                    className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                    title="Cancel"
                >
                    <FaTimes size={20} />
                </button>

                <button
                    onClick={handleCapture}
                    className="p-4 rounded-full bg-white text-[#4c7085] shadow-lg hover:scale-105 transition-transform"
                    title="Capture"
                >
                    <FaCamera size={24} />
                </button>
            </div>
        </div>
    );
};

export default CameraCapture;
