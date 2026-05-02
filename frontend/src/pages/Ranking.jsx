import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Ranking({ setPage }) {
    const [ranking, setRanking] = useState([]);
    const [sort, setSort] = useState("coin");
    const [message, setMessage] = useState("");

    const fetchRanking = async (sortType) => {
        try {
            const response = await fetch(`${API_BASE_URL}/ranking`);
            const data = await response.json();

            if (response.ok) {
                setRanking(data.ranking);
                setMessage("");
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("랭킹 정보를 불러올 수 없습니다.");
        }
    };

    useEffect(() => {
        fetchRanking(sort);
    }, [sort]);

    return (
        <div className="ranking-container">
            <h1>Ranking</h1>

            <div className="ranking-buttons">
                <button onClick={() => setSort("coin")}>코인 순위</button>
                <button onClick={() => setSort("win")}>승리 수 순위</button>
                <button onClick={() => setSort("jackpot")}>잭팟 순위</button>
            </div>

            <p className="message">{message}</p>

            <table className="ranking-table">
                <thead>
                <tr>
                    <th>순위</th>
                    <th>아이디</th>
                    <th>코인</th>
                    <th>승리</th>
                    <th>패배</th>
                    <th>잭팟</th>
                </tr>
                </thead>

                <tbody>
                {ranking.map((user, index) => (
                    <tr key={user.username}>
                        <td>{index + 1}</td>
                        <td>{user.username}</td>
                        <td>{Number(user.coin).toFixed(1)}</td>
                        <td>{user.win}</td>
                        <td>{user.lose_count}</td>
                        <td>{Number(user.jackpot).toFixed(1)}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button onClick={() => setPage("mypage")}>
                마이페이지로 돌아가기
            </button>
        </div>
    );
}

export default Ranking;