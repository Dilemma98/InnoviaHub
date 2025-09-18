import "./loadingStyle.css";

interface LoadingSpinnerProps {
  variant?: "startPage" | "myBookings";
}

const LoadingSpinner = ({ variant }: LoadingSpinnerProps) => {
  return (
      <div className="loader"></div>
  );
};

export default LoadingSpinner;
