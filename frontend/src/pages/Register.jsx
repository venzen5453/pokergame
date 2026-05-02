import { useState } from "react";
import { API_BASE_URL } from "../api";

function Register({ setPage }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async () => {
        if (!username || !email || !password || !passwordConfirm) {
            setMessage("모든 항목을 입력해주세요.");
            return;
        }

        if (password !== passwordConfirm) {
            setMessage("비밀번호가 일치하지 않습니다.");
            return;
        }

        if (password.length < 6) {
            setMessage("비밀번호는 6자 이상이어야 합니다.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("회원가입 성공! 로그인해주세요.");
                setPage("login");
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
            <h2>회원가입</h2>

            <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
            />

            <button onClick={handleRegister}>회원가입</button>

            <p className="message">{message}</p>

            <button className="link-button" onClick={() => setPage("login")}>
                이미 계정이 있나요? 로그인
            </button>
        </div>
    );
}

export default Register;