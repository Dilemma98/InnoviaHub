import { useState, useEffect } from "react";

// Interface for VirtualAssistant component
interface VirtualAssistantProps {
    // Message that triggers assistant active state
    message: string | null;
}
const VirtualAssistant = ({ message }: VirtualAssistantProps) => {

    // State to manage assistant activation
    const [active, setActive] = useState(false);
    // State to manage hovering of the assistant
    const [hover, setHover] = useState(false);

    // Acitave assistant if there is a message coming from ChooseDateTime
    useEffect(() => {
        if (message) {
            setActive(true);
            // Set timer for how long the assistant
            // and talkingbubble should be active
            const timer = setTimeout(() => {
                setActive(false);
            }, 10000);
            return () => clearTimeout(timer);
        } else {
            setActive(false);
        }
    }, [message]);

    return (
        <div
            style={{
                position: "fixed",
                bottom: "0.9em",
                right: "2em",
                width: "4em",
                zIndex: 9999
            }}>
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
                // Tracks hover
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {/* Head */}
                <div
                    style={{
                        transform: active ? "translateY(0em)" : "translateY(0em)",
                        transition: "transform 0.5s ease",
                        width: "4em",
                        height: "4em",
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 30% 30%, #fcd5a1, #b3744a)",
                        boxShadow: active
                            ? "0 0 15px rgba(252,213,161,0.4), 0 0 30px rgba(179,116,74,0.3)"
                            : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        // position: "relative",
                        // right: "2em",
                    }}
                >
                    {/* Left eye */}
                    <div style={{
                        position: "absolute",
                        top: "20px",
                        left: "13px",
                        width: "12px",
                        height: "12px",
                        borderTop: active ? "none" : "2px solid black",
                        borderRadius: active ? "50%" : "9px 9px 0 0",
                        background: active ? "black" : "transparent",
                        transition: "all 0.3s ease"
                    }}
                    >
                        {/* If active */}
                        {active && (
                            <div style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: "#fff",
                                position: "absolute",
                                top: "1px",
                                left: "2px",
                                animation: "pupilMove 6s infinite ease-in-out",
                            }}>
                            </div>
                        )}
                    </div>
                    {/* Right Eye */}
                    <div
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "13px",
                            width: "12px",
                            height: "12px",
                            borderTop: active ? "none" : "2px solid #000",
                            borderRadius: active ? "50%" : "9px 9px 0 0",
                            background: active ? "#000" : "transparent",
                            transition: "all 0.3s ease",
                        }}
                    >
                        {active && (
                            <div
                                style={{
                                    width: "4px",
                                    height: "4px",
                                    borderRadius: "50%",
                                    background: "#fff",
                                    position: "absolute",
                                    top: "1px",
                                    left: "2px",
                                    animation: "pupilMove 6s infinite ease-in-out",
                                }}
                            />
                        )}
                    </div>{/* Mouth */}
                    <div
                        style={{
                            position: "absolute",
                            transition: "all 0.3s ease",
                            left: active ? "1.5em" : "1.4em",
                            top: active ? "2.5em" : "2em",

                            ...(active
                                ? {
                                    // 😮 Mouth open
                                    width: "0.4em",
                                    height: "0.4em",
                                    border: "1px solid #000",
                                    borderRadius: "50%",
                                    background: "black",
                                }
                                : {
                                    // 😊 Mouth closed
                                    width: "1.3em",
                                    height: "0.8em",
                                    borderBottom: "2px solid #000",
                                    borderRadius: "0 0 50% 50%",
                                    background: "transparent",
                                }),
                        }}
                    />

                    {/* Head highlight */}
                    <div
                        style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: "10px",
                            left: "12px",
                            opacity: 0.8,
                        }}
                    />
                </div>
            </div>

            {/* Double booking speech bubble */}
            {active && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "5.5em",
                        right: "2em",
                        background: "#ffc8aee6",
                        color: "#1e293b",
                        padding: "0.5rem 0.8rem",
                        borderRadius: "1rem 1rem 0.1rem 1rem",
                        fontSize: "0.9rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        fontFamily: "Inter, sans-serif",
                        width: "15em",
                        textAlign: "center",
                    }}
                >
                    {/* Message from backend goes here */}
                    {message}
                </div>
            )}

            {/* Thought bubble on hover */}
            {hover && !active && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "7em",
                        right: "2em",
                        background: "#fae7eae6",
                        color: "#1e293b",
                        padding: "0.5rem 0.8rem",
                        borderRadius: "2rem 2rem 2rem 2rem",
                        fontSize: "0.9rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        fontFamily: "Inter, sans-serif",
                        width: "12em",
                        textAlign: "center",
                    }}
                >
                    Hej! Jag är din virtuella assistent. Mitt jobb är att se till så du inte dubbelbokar dig själv!
                    <div
                        style={{
                            position: "absolute",
                            bottom: "-0.5em",
                            left: "1.2em",
                            width: "0",
                            height: "0",
                        }}
                    />
                </div>
            )}

            {/* Pupil animation */}
            <style>{`
        @keyframes pupilMove {
          0%, 100% { transform: translate(0,0); }
          25% { transform: translate(2px, -1px); }
          50% { transform: translate(-2px, 1px); }
          75% { transform: translate(1px, 2px); }
        }
      `}</style>
        </div>
    );
};

export default VirtualAssistant;
