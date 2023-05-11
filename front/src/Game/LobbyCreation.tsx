import { useEffect, useState } from "react";
import "./LobbyCreation.css"
import { useSelector } from "react-redux";
import { selectEnv } from "../utils/redux/selectors";


const PlayerCard = ({playerInfo}:any) => {
	const env = useSelector(selectEnv);

	return (
		<div className="game-creation-player-card">
			<div className="game-player-card-avatar-underdiv">
				<img className="game-player-card-avatar" src={playerInfo.avatar ? "https://" + env.host + ":" + env.port +"/" + playerInfo.avatar : ""} alt="Avatar" />
			</div>
			<div className="game-player-card-title">
				<div>Pseudo</div>
				<div className="game-player-card-lvl">Lvl.</div>
				<div>Status</div>
			</div>
			<div className="game-player-card-info">
				<div className="game-creation-player-card-nam">{playerInfo.pseudo}</div>
				<div className="game-creation-player-card-lvl">{playerInfo.level / 1000}</div>
				<div className="game-creation-player-card-sta">{playerInfo.status}</div>
			</div>
		</div>
	)
}

const GameCreationFrame = ({children, title}:any) => {
return (<div className="game-creation-frame">
			<h1 className="game-creation-frame-title">{title}</h1>
			<div className="game-creation-border"></div>
			{children}
		</div>
	)
}

const LobbyCreation = ({socketQueue, reload, setReload}:any) => {
	const [players, setPlayers] = useState<any>([]);

	useEffect (() =>{
		if (!socketQueue || socketQueue.connected === undefined) return
		socketQueue.off("ConnectToQueueResponse")
		socketQueue.on("ConnectToQueueResponse", (data:any) => {
			setReload(357169)
		})
		socketQueue.emit("GetMyGroup")
	}, [reload, socketQueue, setReload]);

	useEffect (() => {
		const updateGroup = (data:any) => {
			setPlayers(data.players)
			const but_1v1 = document.getElementById("1v1")
			const but_2v2 = document.getElementById("2v2")
			const but_ffa = document.getElementById("ffa")
			const but_normal = document.getElementById("normal")
			const but_beach = document.getElementById("beach")
			const but_jungle = document.getElementById("jungle")
			const but_space = document.getElementById("space")
			for (const but of [but_1v1, but_2v2, but_ffa, but_normal, but_beach, but_jungle, but_space]) {
				but?.classList.remove("game-creation-button-unclicked")
				but?.classList.remove("game-creation-button-clicked")
				but?.classList.remove("game-creation-button-impossible")
			}
			but_1v1?.classList.add("game-creation-button-unclicked")
			but_2v2?.classList.add("game-creation-button-unclicked")
			but_ffa?.classList.add("game-creation-button-unclicked")
			if (data.mode === "ONEVONE") but_1v1?.classList.replace("game-creation-button-unclicked", "game-creation-button-clicked")
			else if (data.mode === "TWOVTWO") but_2v2?.classList.replace("game-creation-button-unclicked", "game-creation-button-clicked")
			else if (data.mode === "FREEFORALL") but_ffa?.classList.replace("game-creation-button-unclicked", "game-creation-button-clicked")
			if (data.players.length > 2) but_1v1?.classList.replace("game-creation-button-unclicked", "game-creation-button-impossible")
			if (data.players.length === 3) but_2v2?.classList.replace("game-creation-button-unclicked", "game-creation-button-impossible")

			but_normal?.classList.add("game-creation-button-unclicked")
			but_beach?.classList.add("game-creation-button-unclicked")
			but_jungle?.classList.add("game-creation-button-unclicked")
			but_space?.classList.add("game-creation-button-unclicked")
			if (data.map === "NORMAL") but_normal?.classList.replace("game-creation-button-unclicked", "game-creation-button-clicked")
			else if (data.map === "BEACH") but_beach?.classList.replace("game-creation-button-unclicked", "game-creation-button-clicked")
			else if (data.map === "JUNGLE") but_jungle?.classList.replace("game-creation-button-unclicked", "game-creation-button-clicked")
			else if (data.map === "SPACE") but_space?.classList.replace("game-creation-button-unclicked", "game-creation-button-clicked")
		}
		socketQueue.off("UpdateGroupResponse")
		socketQueue.on("UpdateGroupResponse", updateGroup)
		socketQueue.emit("GetMyGroup") // update pour toi tous seul quand connection
		// socketQueue.emit("UpdateGroup") sur appuie de bouton update pout tout le monde
	}, [reload, socketQueue]);

	const joinQueue = () => {
		
		socketQueue.emit("ConnectToQueue"); // -> appuie sur le bouton plutot
	} 

	//const joinGroup = () => {
	//	socketQueue.emit("JoinGroup", {groupLogin: "lgiband"}); // -> appuie sur le bouton plutot
	//}
	//const inviteGroup = () => {
	//	socketQueue.emit("InviteGroup", {login: "lgiband"}); // -> appuie sur le bouton plutot
	//}


	const leaveGroup = () => {
		socketQueue.emit("LeaveGroup"); // -> appuie sur le bouton plutot
	}

	const updateGameInfo = (type:any, value:any) => {
		return () => {
			socketQueue.emit("UpdateGroup", {type: type, value: value});
		}
	}

	return (
		<div className="game-creation-background">
			<h1> Welcome in the Lobby</h1>
			<div className="game-creation-main-div">
				<GameCreationFrame title="Users in the Lobby">
					{players[0] ? <PlayerCard playerInfo={players[0]}/> : null}
					{players[1] ? <PlayerCard playerInfo={players[1]}/> : null}
					{players[2] ? <PlayerCard playerInfo={players[2]}/> : null}
					{players[3] ? <PlayerCard playerInfo={players[3]}/> : null}
				</GameCreationFrame>
				<div className="game-creation-settings">
					<GameCreationFrame title="Gamemode">
						<div className="game-creation-gamemode">
							<button id="1v1" className="game-creation-button-unclicked" onClick={updateGameInfo("MODE", "ONEVONE")}>1V1</button>
							<button id="2v2" className="game-creation-button-impossible" onClick={updateGameInfo("MODE", "TWOVTWO")}>2V2</button>
							<button id="ffa" className="game-creation-button-unclicked" onClick={updateGameInfo("MODE", "FREEFORALL")}>FFA</button>
						</div>
					</GameCreationFrame>
					<GameCreationFrame title="Map">
						<div className="game-creation-map">
							<button id="normal" className="game-creation-button-clicked" onClick={updateGameInfo("MAP", "NORMAL")}>Normal</button>
							<button id="beach" className="game-creation-button-unclicked" onClick={updateGameInfo("MAP", "BEACH")}>Beach</button>
							<button id="jungle" className="game-creation-button-unclicked" onClick={updateGameInfo("MAP", "JUNGLE")}>Jungle</button>
							<button id="space" className="game-creation-button-unclicked"onClick={updateGameInfo("MAP", "SPACE")}>Space</button>
						</div>
					</GameCreationFrame>
				</div>
			</div>
			<div className="game-creation-button-div">
				<button className="game-creation-button" onClick={leaveGroup}>Leave Lobby</button>
				<button className="game-creation-button"  onClick={joinQueue}>Start Game</button>
			</div>
			{/*<button onClick={joinGroup}>joinGroup</button>
			<button onClick={inviteGroup}>inviteGroup</button>
			<button>joinQueue</button>
			<button onClick={leaveGroup}>leaveGroup</button>
			<select name="oui" id="oui" onChange={updateMode}>
				<option value="ONEVONE">1v1</option>
				<option value="TWOVTWO">2v2</option>
				<option value="FREEFORALL">FFA</option>
			</select> */}
		</div>
	)
}

export default LobbyCreation;