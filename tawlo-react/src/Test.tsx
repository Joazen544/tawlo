// import React, { useState } from 'react';
// import axios from 'axios';

// const Test = () => {
//   const [file, setFile] = useState();

//   const submit = async (event) => {
//     event.preventDefault();

//     const formData = new FormData();
//     formData.append('image', file);

//     axios
//       .post(`${import.meta.env.VITE_DOMAIN}/api/user/test`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       })
//       .then((res) => {
//         console.log(res.data);
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   };

//   return (
//     <div className="App">
//       <form onSubmit={submit}>
//         <input
//           filename={file}
//           onChange={(e) => setFile(e.target.files[0])}
//           type="file"
//           accept="image/*"
//         ></input>
//         <button type="submit">Submit</button>
//       </form>
//     </div>
//   );
// };

// export default Test;
