import { useState } from "react";
import { API_BASE_URL } from "../api";

function Login({ setPage, setUser }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async () => {
        if (!username || !password) {
            setMessage("아이디와 비밀번호를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setPage("mypage");
            } else {
                setMessage(data.message);
            }

        } catch (error) {
            setMessage("서버와 연결할 수 없습니다.");
        }
    };

    return (
        <div className="auth-container">
            <h1>Poker Game</h1>
            <h2>로그인</h2>

            <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin}>로그인</button>

            <p className="message">{message}</p>

            <button className="link-button" onClick={() => setPage("register")}>
                계정이 없나요? 회원가입
            </button>
        </div>
    );
}

export default Login;