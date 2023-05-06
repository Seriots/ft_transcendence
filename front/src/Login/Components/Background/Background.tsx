import React from 'react';
import './Background.css';

/*	RESSOURCES	*/
import logo_mobile from './Ressources/Logo.png';
import img_lgiband from './Ressources/lgiband.png';
import img_gkehren from './Ressources/gkehren.png';
import img_jbach from './Ressources/jbach.png';
import img_genouf from './Ressources/genouf.png';

const Background = () => {
	return (
		<div>
			<div className="logo-mobile">
				<img src={logo_mobile} alt='background' />
			</div>
			<div className="main-background">
				<div className="our-team">
					<p className="title-team">Our team</p>
					<div className="picture-team">
						<div className="twoteam">
							<div className="profile-team">
								<img src={img_lgiband} alt='avatar' />
								<p>Leo Giband</p>
							</div>
							<div className="profile-team">
								<img src={img_gkehren} alt='avatar' />
								<p>Guillaume Kehren</p>
							</div>
						</div>
						<div className="twoteam">
							<div className="profile-team">
								<img src={img_jbach} alt='avatar' />
								<p>Josephine Bach</p>
							</div>
							<div className="profile-team">
								<img src={img_genouf} alt='avatar' />
								<p>Gabriel Enouf</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Background;
