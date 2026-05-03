import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MyPage from "./pages/MyPage.jsx";
import Game from "./pages/Game.jsx";
import Ranking from "./pages/Ranking.jsx";
import { API_BASE_URL } from "./api";
import "./style.css";

const ALLOWED_PAGES = ["login", "register", "mypage", "game", "ranking"];

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("pokerUser");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch (error) {
      localStorage.removeItem("pokerUser");
      return null;
    }
  });

  const [page, setPage] = useState(() => {
    const savedUser = localStorage.getItem("pokerUser");
    const savedPage = localStorage.getItem("pokerPage");

    if (savedUser && savedPage && ALLOWED_PAGES.includes(savedPage)) {
      return savedPage;
    }

    return savedUser ? "mypage" : "login";
  });

  const logout = () => {
    localStorage.removeItem("pokerUser");
    localStorage.setItem("pokerPage", "login");

    setUser(null);
    setPage("login");
  };

  const checkUserExists = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/user/${user.id}`);

      if (response.status === 404) {
        alert("현재 로그인된 계정이 삭제되었습니다. 다시 로그인해주세요.");
        logout();
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.user) {
        const freshUser = {
          ...user,
          ...data.user,
          coin: Number(data.user.coin ?? user.coin ?? 0),
          jackpot: Number(data.user.jackpot ?? user.jackpot ?? 0),
          win: Number(data.user.win ?? user.win ?? 0),
          lose_count: Number(data.user.lose_count ?? user.lose_count ?? 0),
        };

        setUser(freshUser);
        localStorage.setItem("pokerUser", JSON.stringify(freshUser));
      }
    } catch (error) {
      console.error("유저 확인 실패:", error);
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem("pokerUser", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("pokerPage", page);
  }, [page]);

  useEffect(() => {
    if (user && page === "login") {
      setPage("mypage");
    }

    if (!user && page !== "register") {
      setPage("login");
    }
  }, [user]);

  useEffect(() => {
    checkUserExists();
  }, [user?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkUserExists();
      }
    };

    const handleFocus = () => {
      checkUserExists();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id]);

  if (!user && page !== "register") {
    return <Login setPage={setPage} setUser={setUser} />;
  }

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