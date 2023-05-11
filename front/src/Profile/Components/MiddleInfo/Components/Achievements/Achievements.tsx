import React from 'react';
import './Achievements.css';
import { BasicFrame } from '../../MiddleInfo';
/*	TMP RESSOURCES	*/
import achievement1 from './Ressources/achievement1.png';
import achievement2 from './Ressources/achievement2.png';
import achievement3 from './Ressources/achievement3.png';
import achievement4 from './Ressources/achievement4.png';
import achievement5 from './Ressources/achievement5.png';
import achievement6 from './Ressources/achievement6.png';
import { useAxios } from '../../../../../utils/hooks';
import { selectEnv } from '../../../../../utils/redux/selectors';
import { useSelector } from 'react-redux';

interface AchievementProps {
	img: string;
	title: string;
	description: string;
	lock?: boolean;
}

const Achievement = ({ img, title, description, lock }: AchievementProps) => {
	return (
		<div className={lock ? 'achievement lock' : 'achievement'}>
			<div className="img-wrapper">
				<img src={img} alt="achievement-img" />
			</div>
			<div className="content-wrapper">
				<h4>{title}</h4>
				<p>{description}</p>
			</div>
		</div>
	);
};

export const Achievements = ({ userData }: { userData: any }) => {
	const env = useSelector(selectEnv);
	const {
		isLoading,
		data,
		error,
	}: { isLoading: boolean; data: any; error: boolean } = useAxios(
		'https://' +
			env.host +
			':' +
			env.port +
			'/users/achievement/' +
			userData.username
	);

	const checkAchievement = (id: number) => {
		if (data) {
			for (const element of data.achievements) {
				if (element.id === id) {
					return true;
				}
			}
			return false;
		} else return false;
	};

	if (isLoading && !error) return <div></div>;

	return (
		<div className="achievements">
			<BasicFrame title="Achievements">
				<Achievement
					img={achievement1}
					title="Ace"
					description="Win a game without letting the opponent score a single point."
					lock={checkAchievement(1) ? false : true}
				/>
				<Achievement
					img={achievement2}
					title="Brave"
					description="Win a game with 20pts or more"
					lock={checkAchievement(2) ? false : true}
				/>
				<Achievement
					img={achievement3}
					title="Lucky"
					description="Win a game with 1pt or less"
					lock={checkAchievement(3) ? false : true}
				/>
				<Achievement
					img={achievement4}
					title="Beginner"
					description="Win a game"
					lock={checkAchievement(4) ? false : true}
				/>
				<Achievement
					img={achievement5}
					title="Experienced"
					description="Win 10 games"
					lock={checkAchievement(5) ? false : true}
				/>
				<Achievement
					img={achievement6}
					title="Veteran"
					description="Reach Level 20"
					lock={checkAchievement(6) ? false : true}
				/>
			</BasicFrame>
		</div>
	);
};
