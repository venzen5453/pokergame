import { useState } from "react";
import { API_BASE_URL } from "../api";

function ForgotPassword({ setPage }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const resetPassword = async () => {
        setMessage("");

        if (!username || !email || !newPassword || !confirmPassword) {
            setMessage("모든 항목을 입력해주세요.");
            return;
        }

        if (newPassword.length < 4) {
            setMessage("새 비밀번호는 4자 이상 입력해주세요.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("새 비밀번호가 서로 일치하지 않습니다.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    email,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || "비밀번호가 변경되었습니다.");

                setTimeout(() => {
                    setPage("login");
                }, 1200);
            } else {
                setMessage(data.message || "비밀번호 변경에 실패했습니다.");
            }
        } catch (error) {
            console.error("비밀번호 재설정 실패:", error);
            setMessage("서버와 연결할 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h1>POKER GAME</h1>
            <h2>비밀번호 재설정</h2>

            <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type="email"
                placeholder="가입한 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="새 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button onClick={resetPassword} disabled={loading}>
                {loading ? "변경 중..." : "비밀번호 변경"}
            </button>

            <button
                type="button"
                className="link-button"
                onClick={() => setPage("login")}
            >
                로그인으로 돌아가기
            </button>

            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default ForgotPassword;