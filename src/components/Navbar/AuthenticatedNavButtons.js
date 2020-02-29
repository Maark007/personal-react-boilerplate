import classnames from 'classnames';
import { Button } from 'rbx';
import React, { lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSignOutAlt } from 'react-icons/fa';
import { useIdentityContext } from 'react-netlify-identity';
import { useLocation } from 'react-router-dom';

import { withSuspense } from '../../hocs';
import { useNavigate } from '../../hooks';
import { SETTINGS as SETTINGS_CONFIG } from '../../routes/config';
import { SETTINGS } from '../../routes/private';
import Icon from '../Icon';
import Loader from '../Loader';

const NavButton = lazy(() =>
  import(/* webpackChunkName: "navbar.nav_button" */ './NavButton'),
);

/**
 *
 * @param {{
 * isLoggingOut: boolean,
 * isConfirmedUser: boolean,
 * handleLogout: () => Promise<void>,
 * t: import('react-i18next').UseTranslationResponse['t']
 * }}
 */
export default withSuspense(function AuthenticatedNavButtons() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { logoutUser } = useIdentityContext();
  const { pathname } = useLocation();
  const { t } = useTranslation(['navigation', 'routes']);
  const navigate = useNavigate();

  function handleLogout() {
    navigate('/');
    setIsLoggingOut(true);

    logoutUser().then(() => {
      setIsLoggingOut(false);
    });
  }

  return (
    <>
      <Button.Group>
        <NavButton
          color="primary"
          to={SETTINGS_CONFIG.clientPath}
          disabled={isLoggingOut}
          onMouseOver={() => SETTINGS.component.preload()}
        >
          <Icon
            svg={SETTINGS_CONFIG.icon}
            className={classnames(
              'is-spinning',
              pathname.includes('/settings/') && 'active',
            )}
          />
          <span>{t('routes:settings')}</span>
        </NavButton>

        <Button color="danger" onClick={handleLogout} disabled={isLoggingOut}>
          <Icon svg={FaSignOutAlt} />
          <span>{t('logout')}</span>
        </Button>
      </Button.Group>
      {isLoggingOut && <Loader isFullPage />}
    </>
  );
});