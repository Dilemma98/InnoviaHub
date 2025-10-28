import "./welcomeText.css";
import InfoImg from "../../assets/infoImg.jpg";
const WelcomeText = () => {
    return(
        <div className="welcomeText">
            <h2>Välkommen till InnoviaHub!</h2>
            <p>InnoviaHub är din digitala plattform för att enkelt 
                hitta och boka skrivbord, mötesrum, VR-headsets och 
                AI-servrar på kontoret. Med vår snabba översikt får du 
                direkt koll på tillgängliga resurser och kan planera 
                din arbetsdag effektivt och smidigt. Upptäck smidiga bokningar, 
                interaktiv kontorslayout och allt du behöver för en produktiv 
                dag på InnoviaHub!</p>
                <div className="infoImg">
                    <img src={InfoImg} alt="" />
                </div>
                
        </div>
    );
}

export default WelcomeText;