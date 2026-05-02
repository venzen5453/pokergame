import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MyPage from "./pages/MyPage.jsx";
import Game from "./pages/Game.jsx";
import Ranking from "./pages/Ranking.jsx";
import "./style.css";

function App() {
  const [page, setPage] = useState("login");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("pokerUser");

    if (savedUser) {
      return JSON.parse(savedUser);
    }

    return null;
  });

  const logout = () => {
    localStorage.removeItem("pokerUser");
    setUser(null);
    setPage("login");
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem("pokerUser", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setPage("mypage");
    }
  }, []);

  if (page === "register") {
    return <Register setPage={setPage} />;
  }

  if (page === "mypage") {
    return (
        <MyPage
            user={user}
            setUser={setUser}
            setPage={setPage}
            logout={logout}
        />
    );
  }

  if (page === "game") {
    return (
        <Game
            user={user}
            setUser={setUser}
            setPage={setPage}
            logout={logout}
        />
    );
  }

  if (page === "ranking") {
    return <Ranking setPage={setPage} />;
  }

  return <Login setPage={setPage} setUser={setUser} />;
}

export default App;