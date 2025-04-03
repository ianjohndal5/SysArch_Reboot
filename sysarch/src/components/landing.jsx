import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { useAuth } from '../context/auth-context';  // Add this import


export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false); // State to manage form type
  const [showContent, setShowContent] = useState(false); // State to manage content change delay
  const [inputs, setInputs] = useState({});
  const { login } = useAuth(); 
  let navigate = useNavigate();
  const handleChange = (event) => {
    const { name, value } = event.target; // Extracting name and value from input
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value, // Update state dynamically
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    await login(inputs); // All logic is now handled in auth context
  };

const handleSubmit = async (event) => {
  event.preventDefault();

  // Client-side validation for ID number
  if (inputs.idno <= 0) {
    // Show loading alert
    const loadingAlert = Swal.fire({
      title: 'Processing...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  
    // Delay for error message
    setTimeout(async () => {
      await Swal.fire({
        title: 'Invalid ID Number',
        text: 'ID number must be a positive number (greater than 0)',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
  
      // Close the loading alert after the error alert
      loadingAlert.close();
    }, 1000); // Delay of 1 second
  
    return; // Stop the form submission
  }
  

  // Show loading alert
  const loadingAlert = Swal.fire({
    title: 'Processing...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const response = await fetch(
      "http://localhost/sysarch_reboot/sysarch_php/register.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      }
    );

    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error("Server returned an invalid response");
    }

    if (!response.ok || result.error) {
      // Handle specific duplicate errors
      let errorMessage = result.error || "Registration failed";

      if (result.error.includes("Duplicate entry")) {
        if (result.error.includes("for key 'PRIMARY'")) {
          errorMessage = "This ID number is already registered";
        } else if (result.error.includes("for key 'username'")) {
          errorMessage = "This username is already taken";
        } else if (result.error.includes("for key 'email'")) {
          errorMessage = "This email is already registered";
        }
      }

      throw new Error(errorMessage);
    }

    // Success case
    await Swal.fire({
      title: 'Success!',
      text: result.message || "Registration successful!",
      icon: 'success',
      confirmButtonColor: '#3085d6',
      timer: 3000
    });

    setInputs({});
    handleTransition(false);

  } catch (error) {
    // Adding delay before showing the error alert
    setTimeout(async () => {
      await Swal.fire({
        title: 'Error!',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }, 1000); // Delay of 1 second
  } finally {
    setTimeout(() => loadingAlert.close(), 1000); // Delay closing spinner for better UX
  }
};

  
  const handleTransition = (registering) => {
    setIsRegistering(registering); // Move forms immediately
    setTimeout(() => {
      setShowContent(registering); // Change content after delay
    }, 195); // Content delay duration (300ms in this example)
  };

  return (
    <div className="bg-blue-500">
    <div className="ml-10 min-h-screen flex items-center justify-center bg-gray-100">
      
      {/* Main container */}
      <div
        className="relative w-screen max-w-5xl min-h-[400px] bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-700 flex"
        style={{ minHeight: "500px", height: "auto" }}
      >
        {/* Login/Register Forms */}
        <div
          className={`absolute w-1/2 h-full bg-white flex flex-col justify-center px-10 transform transition-all duration-700 ease-in-out ${
            isRegistering ? "translate-x-full" : ""
          }`}
        >
          {showContent ? (
            <div className="space-y-4">
              {/* Register Form */}
              <h1 className="text-3xl font-bold mb-6 animate-fadeIn">Create Account</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Row: Firstname, Middlename, Lastname */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="animate-fadeInUp delay-100">
                    <label
                      htmlFor="firstname"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Firstname
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      id="firstname"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                  <div className="animate-fadeInUp delay-150">
                    <label
                      htmlFor="middlename"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Middlename
                    </label>
                    <input
                      type="text"
                      name="middlename"
                      id="middlename"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                  <div className="animate-fadeInUp delay-200">
                    <label
                      htmlFor="lastname"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Lastname
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      id="lastname"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                </div>
  
                {/* Second Row: Idno, Course, Level */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="animate-fadeInUp delay-250">
                    <label
                      htmlFor="idno"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Idno
                    </label>
                    <input
                      type="number"
                      name="idno"
                      id="idno"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                  <div className="animate-fadeInUp delay-300">
                  <label
                    htmlFor="course"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Course
                  </label>
                  <select
                    name="course"
                    id="course"
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm  border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                    required
                    value={inputs.course || ""}
                  >
                    <option value="">Select course</option>
                    <option value="BSIT">Bachelor of Science in Information Technology</option>
                    <option value="BSCS">Bachelor of Science in Computer Science</option>
                    <option value="BSIS">Bachelor of Science in Information Systems</option>
                    <option value="BSCE">Bachelor of Science in Computer Engineering</option>
                    <option value="BSECE">Bachelor of Science in Electronics Engineering</option>
                    <option value="BSMath">Bachelor of Science in Mathematics</option>
                    <option value="BSEE">Bachelor of Science in Electrical Engineering</option>
                    <option value="BSME">Bachelor of Science in Mechanical Engineering</option>
                    <option value="BSChem">Bachelor of Science in Chemistry</option>
                    <option value="BSBio">Bachelor of Science in Biology</option>
                    <option value="BSPsych">Bachelor of Science in Psychology</option>
                    <option value="BSN">Bachelor of Science in Nursing</option>
                    <option value="BSA">Bachelor of Science in Accountancy</option>
                    <option value="BSBA">Bachelor of Science in Business Administration</option>
                    <option value="BSEd">Bachelor of Science in Education</option>
                    <option value="BSArch">Bachelor of Science in Architecture</option>
                  </select>
                </div>

                <div className="animate-fadeInUp delay-350">
                  <label
                    htmlFor="level"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Year Level
                  </label>
                  <select
                    name="level"
                    id="level"
                    onChange={handleChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                    required
                    value={inputs.level || ""}
                  >
                    <option value="">Select level</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
                </div>
  
                {/* Third Row: Email, Address */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-fadeInUp delay-400">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                  <div className="animate-fadeInUp delay-450">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                </div>
  
                {/* Fourth Row: Username, Password */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-fadeInUp delay-500">
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                  <div className="animate-fadeInUp delay-550">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                      required
                    />
                  </div>
                </div>
  
                {/* Submit Button */}
                <div className="animate-fadeInUp delay-600">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    Register
                  </button>
                </div>
              </form>
              <div className="animate-fadeInLeft delay-650">
                <button
                  onClick={() => handleTransition(false)}
                  className="mt-4 text-sm text-blue-500 hover:underline transition-all duration-300 hover:text-blue-700"
                >
                  Go back to Login
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Login Form with CCS Logo and Updated Title */}
              <div className="flex flex-col items-center mb-6">
                <img 
                  src="/ccslogo.png" 
                  alt="CCS Logo" 
                  className="w-16 h-16 mb-4 animate-fadeIn"
                />
                <h1 className="text-3xl font-bold text-center animate-fadeIn">
                  CCS Sit-In Monitoring System
                </h1>
                <p className="text-gray-600 mt-2 animate-fadeIn">
                  College of Computer Studies
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="animate-fadeInUp delay-100">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <input
                    type="username"
                    name="username"
                    id="username"
                    placeholder="Enter your username"
                    value={inputs.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                    required
                  />
                </div>
                <div className="animate-fadeInUp delay-150">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Enter your password"
                    value={inputs.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
                    required
                  />
                </div>
                <div className="animate-fadeInUp delay-200">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    Login
                  </button>
                </div>
              </form>
              <div className="animate-fadeInUp delay-250">
                <button
                  onClick={() => handleTransition(true)}
                  className="mt-4 text-sm text-blue-500 hover:underline transition-all duration-300 hover:text-blue-700"
                >
                  Register Here
                </button>
              </div>
            </div>
          )}
        </div>
  
        {/* Sliding Panel */}
        <div
          className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center transform transition-all duration-700 ease-in-out ${
            isRegistering ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="text-center p-8 animate-fadeIn">
            <h1 className="text-4xl font-bold text-white mb-4">
              {showContent ? "Welcome Back!" : "Hello, Student!"}
            </h1>
            <p className="text-white mb-6">
              {showContent
                ? "To keep connected with us please login with your personal info"
                : "Enter your personal details and start journey with us"}
            </p>
            <button
              onClick={() => handleTransition(!isRegistering)}
              className="px-6 py-2 border-2 border-white text-white rounded-full font-medium hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              {showContent ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}