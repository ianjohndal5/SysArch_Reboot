import { useState } from "react";

export default function CreateUser() {
  const [inputs, setInputs] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target; // Extracting name and value from input
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value, // Update state dynamically
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      const response = await fetch(
        "http://localhost/sysarch_reboot/sysarch_php/register.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs), // Send form data
        }
      );
  
      // Check if the response status is OK
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
  
      const result = await response.json();
      if (result.message) {
        alert(result.message); // Show success message
      } else {
        alert(result.error || "Something went wrong!");
      }
    } catch (error) {
    }
  };
  

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <label>Idno: </label>
        <input type="text" name="idno" onChange={handleChange} required/>
        <br />
        <label>Firstname: </label>
        <input type="text" name="firstname" onChange={handleChange} required/>
        <br />
        <label>Middlename: </label>
        <input type="text" name="middlename" onChange={handleChange} required/>
        <br />
        <label>Lastname: </label>
        <input type="text" name="lastname" onChange={handleChange} required/>
        <br />
        <label>Course: </label>
        <input type="text" name="course" onChange={handleChange} required/>
        <br />
        <label>Level: </label>
        <input type="text" name="level" onChange={handleChange} required/>
        <br />
        <label>Email: </label>
        <input type="email" name="email" onChange={handleChange} required/>
        <br />
        <label>Address: </label>
        <input type="text" name="address" onChange={handleChange} required/>
        <br />
        <label>Username: </label>
        <input type="text" name="username" onChange={handleChange} required/>
        <br />
        <label>Password: </label>
        <input type="password" name="password" onChange={handleChange} required/>
        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
