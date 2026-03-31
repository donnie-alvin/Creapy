// React Imports
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
// React Icons
import { FaGoogle } from "react-icons/fa";
// MUI Imports
import AppButton from "../ui/AppButton";
// Firebase Imports
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
// Firebase Config
import { app } from "../../firebase";
// Redux
import { useGoogleLoginMutation } from "../../redux/api/authApiSlice";
import { setUser } from "../../redux/auth/authSlice";
// Custom Imports
import DotLoader from "../Spinner/dotLoader";

const GoogleOAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [google, { isLoading }] = useGoogleLoginMutation();

  const googleHandler = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);

      const res = await signInWithPopup(auth, provider);
      const payload = {
        name: res.user.displayName,
        email: res.user.email,
        photo: res.user.photoURL,
      };
      const user: any = await google(payload);
      dispatch(setUser(user.data));
      localStorage.setItem("user", JSON.stringify(user.data));
      const role = user?.data?.data?.user?.role;
      if (role === "landlord") {
        navigate("/dashboard/landlord");
        } else if (role === "tenant") {
          navigate("/dashboard/tenant");
        } else if (role === "admin") {
          navigate("/dashboard/admin");
        } else {
          navigate("/");
        }
    } catch (error) {
      console.error("Google GoogleOAuth Error: ", error);
    }
  };

  return (
    <>
      <AppButton
        fullWidth
        disabled={isLoading}
        sx={{
          margin: "5px 0 20px 0",
          background: "#de4a39",
          color: "#fff",
          lineHeight: "0",
          "&:hover": {
            background: "#de4a39",
          },
        }}
        startIcon={<FaGoogle style={{ fontSize: "15px" }} />}
        onClick={googleHandler}
      >
        {isLoading ? (
          <DotLoader color="#fff" size={12} />
        ) : (
          "Continue With Google"
        )}
      </AppButton>
    </>
  );
};

export default GoogleOAuth;
