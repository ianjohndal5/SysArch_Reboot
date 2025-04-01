import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of the system',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('user');
        navigate('/');
        Swal.fire(
          'Logged out!',
          'You have been successfully logged out.',
          'success'
        );
      }
    });
  };

  return (
    <nav>
      <ul className="flex items-center w-full bg-blue-300 justify-between px-10 py-4 gap-4">
        <div className="flex gap-4">
          <li>
            <Link to="/user/list" className="hover:text-blue-700">List</Link>
          </li>
          <li>
            <Link to="/user/register" className="hover:text-blue-700">Register</Link>
          </li>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </ul>
    </nav>
  );
}

export default Navbar;