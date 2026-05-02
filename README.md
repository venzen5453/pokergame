# PokerGame

React + Express + MySQL로 제작한 웹 기반 파이브드로우 포커 게임입니다.  
회원가입, 로그인, 게임 플레이, 미션, 랭킹, 마이페이지 통계, 조커 확률 시스템, 잭팟 시스템 등을 포함한 포트폴리오용 프로젝트입니다.

---

## 프로젝트 개요

PokerGame은 사용자가 코인을 배팅하고 파이브드로우 포커를 플레이하는 게임입니다.  
카드를 HOLD하고 선택하지 않은 카드를 교환한 뒤, 최종 족보에 따라 보상을 받습니다.

투페어 이상부터는 미니게임에 도전할 수 있으며, 성공 시 보상이 2배가 되고 실패 시 보상을 잃습니다.  
풀하우스 이상에서는 잭팟 보너스가 포함된 상태로 미니게임에 진입합니다.

또한 10판마다 조커 등장 확률이 증가하고, 30판마다 조커가 확정 등장하는 특별 라운드 시스템을 구현했습니다.

---

## 사용 기술

### Frontend
- React
- Vite
- JavaScript
- CSS
- localStorage

### Backend
- Node.js
- Express
- MySQL2
- dotenv
- bcrypt
- jsonwebtoken

### Database
- MySQL
- database name: `pokergame_db`

---

## 주요 기능

### 사용자 기능
- 회원가입
- 로그인
- 로그아웃
- 마이페이지
- 랭킹 조회

### 게임 기능
- 파이브드로우 포커
- 카드 HOLD 기능
- 선택하지 않은 카드 교환
- 족보 판정
- 배당 계산
- 승리 / 패배 기록 저장
- 게임 상세 기록 저장
- 최종 카드 5장 저장
- 조커 등장 여부 저장

### 미니게임 기능
- 투페어 이상일 때 미니게임 진입 가능
- 미니게임 성공 시 보상 2배
- 미니게임 실패 시 보상 0
- 미니게임 포기 시 기존 보상 수령

### 잭팟 기능
- 일반 승리 시 최종 보상의 1%를 잭팟에 적립
- 실제 지급 보상은 99%
- 풀하우스 이상일 경우 현재 잭팟을 보상에 더한 상태로 미니게임 진입
- 잭팟 수령 판에서는 잭팟 적립 없음

### 조커 시스템
- 기본 조커 등장 확률 적용
- 10판마다 조커 등장 확률 45%
- 30판마다 조커 확정 등장
- 조커 특별 라운드 오버레이 애니메이션
- 조커 카드 강조 디자인
- 조커 등장 기록 저장
- 마이페이지에서 조커 등장 횟수 / 등장률 / 조커 승리 횟수 확인 가능

### 미션 시스템
- 일일 미션
- 주간 미션
- 업적 미션
- 미션 완료 보상
- 미션 완료 알림
- 보상 수령 기록 저장

### 마이페이지 기능
- 보유 코인 확인
- 승리 수 / 패배 수 확인
- 총 플레이 수
- 승률
- 총 획득 포인트
- 최고 획득 포인트
- 평균 획득 포인트
- 미니게임 성공률
- 잭팟 수령 횟수
- 조커 등장 통계
- 게임 기록 필터
- 게임 상세 기록 모달
- 최종 카드 5장 표시

### 설정 기능
- 효과음 ON / OFF
- 효과음 음량 조절
- 테마 변경
  - 카지노 그린
  - 다크
  - 로얄 퍼플
- 카드 디자인 변경
  - Classic
  - Modern
  - Luxury
- 설정값 localStorage 저장

---

## 게임 규칙

### 기본 진행

1. 사용자가 배팅 금액을 입력합니다.
2. 게임 시작 버튼을 누릅니다.
3. 카드 5장이 배분됩니다.
4. 유지하고 싶은 카드를 HOLD합니다.
5. HOLD하지 않은 카드를 교환합니다.
6. 최종 카드 5장으로 족보를 판정합니다.
7. 족보에 따라 보상이 계산됩니다.
8. 투페어 이상이면 미니게임을 진행할 수 있습니다.
9. 결과가 게임 기록에 저장됩니다.

---

## 배당표

| 족보 | 배당 |
|---|---:|
| 원페어 | x0.5 |
| 투페어 | x1 |
| 트리플 | x2 |
| 스트레이트 | x3 |
| 플러시 | x5 |
| 풀하우스 | x7 |
| 포카드 | x15 |
| 스트레이트 플러시 | x30 |
| 로얄 스트레이트 플러시 | x50 |
| 파이브카드 | x100 |

---

## 조커 확률 규칙

| 판수 | 조커 확률 |
|---|---:|
| 일반 판 | 기본 확률 |
| 10판, 20판, 40판, 50판 ... | 45% |
| 30판, 60판, 90판 ... | 100% |

30판마다 조커가 확정 등장하며, 10판 단위의 특별 라운드에서는 조커 확률이 크게 증가합니다.

---

## 프로젝트 구조

```txt
pokergame
├─ backend
│  ├─ server.js
│  ├─ db.js
│  ├─ routes
│  │  └─ auth.js
│  ├─ package.json
│  └─ .env
│
├─ frontend
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ Game.jsx
│  │  ├─ MyPage.jsx
│  │  ├─ Ranking.jsx
│  │  ├─ MissionModal.jsx
│  │  ├─ api.js
│  │  └─ App.css
│  ├─ package.json
│  └─ vite.config.js
│
└─ README.md





실행 방법
1. MySQL 데이터베이스 생성

MySQL Workbench에서 실행합니다.

CREATE DATABASE pokergame_db
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
2. Backend 설정

backend 폴더로 이동합니다.

cd C:\Users\venze\Desktop\pokergame\backend

패키지를 설치합니다.

npm install

.env 파일을 생성하고 아래 내용을 입력합니다.

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=본인_MySQL_비밀번호
DB_NAME=pokergame_db
JWT_SECRET=pokergame_secret_key

서버를 실행합니다.

node server.js

정상 실행 시 예시:

MySQL 연결 성공
서버 실행 중
3. Frontend 설정

frontend 폴더로 이동합니다.

cd C:\Users\venze\Desktop\pokergame\frontend

패키지를 설치합니다.

npm install

개발 서버를 실행합니다.

npm run dev -- --host 0.0.0.0

PC에서 접속:

http://localhost:5173

모바일에서 접속할 경우 frontend/src/api.js의 IP 주소를 본인 PC의 내부 IP로 맞춰야 합니다.

예시:

export const API_BASE_URL = "http://192.168.0.216:3000/api/auth";
주요 DB 테이블
users

사용자 정보를 저장합니다.

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    coin INT NOT NULL DEFAULT 1000,
    jackpot INT NOT NULL DEFAULT 0,
    win INT NOT NULL DEFAULT 0,
    lose_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
game_logs

게임 기록을 저장합니다.

CREATE TABLE game_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    bet DECIMAL(10,1) NOT NULL,
    hand_name VARCHAR(50) NOT NULL,
    base_reward DECIMAL(10,1) DEFAULT 0.0,
    jackpot_fee DECIMAL(10,1) DEFAULT 0.0,
    final_reward DECIMAL(10,1) DEFAULT 0.0,
    used_mini_game TINYINT(1) DEFAULT 0,
    mini_result VARCHAR(20) DEFAULT 'none',
    jackpot_used TINYINT(1) DEFAULT 0,
    final_cards JSON NULL,
    joker_used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
mission_claims

미션 보상 수령 기록을 저장합니다.

CREATE TABLE mission_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mission_type VARCHAR(20) NOT NULL,
    mission_key VARCHAR(100) NOT NULL,
    period_key VARCHAR(50) NOT NULL,
    reward INT NOT NULL DEFAULT 0,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_mission_claim (
        user_id,
        mission_type,
        mission_key,
        period_key
    )
);
주요 API
Auth
Method	URL	설명
POST	/api/auth/register	회원가입
POST	/api/auth/login	로그인
GET	/api/auth/mypage/:userId	마이페이지 정보 조회
Game
Method	URL	설명
POST	/api/auth/update-coin	코인 업데이트
POST	/api/auth/game-log	게임 기록 저장
GET	/api/auth/game-logs/:userId	게임 기록 조회
GET	/api/auth/user-stats/:userId	사용자 통계 조회
GET	/api/auth/ranking	랭킹 조회
Mission
Method	URL	설명
GET	/api/auth/missions/:userId	미션 상태 조회
POST	/api/auth/missions/claim	미션 보상 수령
화면 구성
게임 화면
카드 테이블
배팅 입력
조커 확률 표시
잭팟 표시
배당표
설정 버튼
미션 버튼
마이페이지 이동 버튼
마이페이지
사용자 정보
플레이 통계
족보별 등장 횟수
조커 통계
게임 기록 필터
게임 상세 기록 모달
미션 화면
일일 미션
주간 미션
업적 미션
완료 상태 표시
보상 수령 버튼
포트폴리오 포인트

이 프로젝트에서 중점적으로 구현한 부분은 다음과 같습니다.

React 상태 관리를 이용한 카드 게임 흐름 구현
Express API를 통한 사용자 정보, 게임 기록, 미션 데이터 관리
MySQL을 이용한 회원 / 게임 로그 / 미션 기록 저장
조커 확률 시스템과 특별 라운드 연출
미니게임과 잭팟 보상 로직
localStorage를 활용한 사용자 설정 저장
PC / 모바일 반응형 UI
게임 기록 필터와 상세 모달 구현
최종 카드 정보를 JSON으로 저장하고 다시 화면에 표시
앞으로 개선할 점
ErrorBoundary 추가로 흰 화면 방지
서버 오류 발생 시 사용자 안내 메시지 강화
게임 기록 페이지네이션
관리자 페이지 추가
실제 배포 환경 구성
프론트엔드와 백엔드 배포
DB 호스팅 적용
테스트 코드 추가
실행 명령어 정리
Backend
cd C:\Users\venze\Desktop\pokergame\backend
node server.js
Frontend
cd C:\Users\venze\Desktop\pokergame\frontend
npm run dev -- --host 0.0.0.0