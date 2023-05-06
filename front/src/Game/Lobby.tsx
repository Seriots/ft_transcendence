import { useEffect, useState } from "react";
import "./Lobby.css"
import { selectEnv } from "../utils/redux/selectors";
import { useSelector } from "react-redux";

const LobbyBox = ({children}:any) => {
	return (
		<div className="game-waiting-background">
			{children}
		</div>
)}

const PlayerInLobby = ({player}:any) => {
	const env = useSelector(selectEnv);

	return (
		player !== undefined && player !== null ?
		<div className="game-waiting-player">
			<div className="game-waiting-player-avatar-underdiv">
				
				<img className="game-waiting-player-avatar" src={player.avatar ? 'http://' + env.host + ':' + env.port +'/' + player.avatar : ""} alt="Avatar" />
			</div>
			<div className="game-waiting-player-name">{player.login}</div>
			<div className="game-waiting-player-rank">{player.elo} LP</div>
		</div>
		:
		<div className="game-waiting-player-absent">
			<div className="game-waiting-no-player"></div>
		</div>
	)
}

const LobbyTimer = ({socketQueue}:any) => {
	const [timer, updateTimer] = useState(0);

	const setTimer = (timer:number) => {
		if (timer === 0) {
			return "00:00";
		}
		const minutes = Math.floor(timer / 60);
		const seconds = timer - minutes * 60;
		return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
	}

	const getTimer = (data:any) => {
		updateTimer(parseInt(data.message));
	}

	useEffect(() => {
		socketQueue.off("TimerResponse");
		socketQueue.on("TimerResponse", getTimer);
		socketQueue.emit("Timer");
	}, [socketQueue]);

	useEffect(() => {
		const interval = setInterval(() => updateTimer(current => (current + 1)), 1000);
		return () => {
			clearInterval(interval);
		};
	}, [timer]);


	return (<div className="game-waiting-timer">{setTimer(timer)}</div>)

}

const LobbyChat = ({socketQueue}:any) => {
	const [input, setInput] = useState("");

	
	const sendFunction = (message:string) => {
		if (message === "")
			return;
		socketQueue.emit("ChatWithGroup", {message: message});

		setInput("");
		const inputDiv = document.querySelector("input");
		if  (inputDiv !== null) {
			inputDiv.value = "";
		}
	}
	
	const handleChange = (e:any) => {
		setInput(e.target.value);
	}

	const handleEnter = (e:any) => {
		if (e.key === "Enter")
			sendFunction(input);
	}

	const handleMessage = (data:any) => {
		const chatUl = document.getElementById("lobby-chat");
		const li = document.createElement("li");
		if (chatUl) {
			li.innerHTML = `<b>${data.login}:</b> ${data.message}`
			chatUl.appendChild(li);
			localStorage.setItem("lobby-chat-storage", chatUl.innerHTML);
			chatUl.scrollTop = chatUl.scrollHeight;
		}
	};

	useEffect(() => {
		socketQueue.off("GetNewMessage")
		socketQueue.on("GetNewMessage", handleMessage);
		
	}, [socketQueue]);

	useEffect(() => {
		const chatUl = document.querySelector("#lobby-chat");
		const preMsg = localStorage.getItem("lobby-chat-storage");
		
		if (chatUl !== null && preMsg !== null)
			chatUl.innerHTML = preMsg;
		if (chatUl)
			chatUl.scrollTop = chatUl.scrollHeight;

	}, [])

	return (
		<div className="game-waiting-chat">
			<input id="lobby-input" type="text" onKeyDown={handleEnter} onChange={handleChange} placeholder="Type a message..."/>
			<button onClick={() => sendFunction(input)}>Send</button>
			<ul id="lobby-chat">
				
			</ul>
		</div>
	)
}

function Lobby({socketQueue, login, setReload, reload}:any) {
	const [player1, setPlayer1] = useState(undefined);
	const [player2, setPlayer2] = useState(undefined);
	const [player3, setPlayer3] = useState(undefined);

	
	useEffect(() => {
		const setPlayer = (data:any) => {
			if (!data || data.in === false)
				setReload(987456);
			else
			{
				setPlayer1(data.player1);
				setPlayer2(data.player2);
				setPlayer3(data.player3);
			}
			socketQueue.off("imInQueueResponse");
		}
	
		const DisconnectFromQueueResponse = (data:any) => {
			setReload(22654563);
			socketQueue.off("DisconnectFromQueueResponse")
		}

		socketQueue.off("imInQueueResponse")
		socketQueue.on("imInQueueResponse", setPlayer);
		socketQueue.emit("imInQueue", {login: login});
		socketQueue.off("DisconnectFromQueueResponse")
		socketQueue.on("DisconnectFromQueueResponse", DisconnectFromQueueResponse);
	}, [socketQueue, login, setReload]);


	const handleLeave = () => {
		localStorage.removeItem("lobby-chat-storage"); 
		socketQueue.emit("DisconnectFromQueue");
		socketQueue.off("imInQueueResponse");
		socketQueue.off("GetNewMessage");
	};

	return (
		<div className="game-waiting-parent-div">
			{/* <div className="game-waiting-nav-bar">
			</div> */}
			<LobbyBox>
				<LobbyTimer socketQueue={socketQueue} />

				<div className="game-waiting-players">
					<PlayerInLobby player={player1}/>
					<PlayerInLobby player={player2}/>
					<PlayerInLobby player={player3}/>
				</div>

				<LobbyChat socketQueue={socketQueue} />
				
				<button className="game-waiting-button-cancel" onClick={handleLeave} >Cancel Queue</button>


			</LobbyBox>


		</div>
	);
};

export default Lobby;
