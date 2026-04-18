import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { flashOutline, flash, barChartOutline, barChart } from 'ionicons/icons';

import TodayPage from './pages/TodayPage';
import ProgressPage from './pages/ProgressPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
import '@ionic/react/css/palettes/dark.class.css';

/* Theme variables */
import './theme/variables.css';
import './theme/global.css';
import './App.css';
import { useStore } from './store/useStore';

setupIonicReact();

const App: React.FC = () => {
  const theme = useStore(state => state.theme);

  React.useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
  }, [theme]);

  console.log('App rendering...');
  return (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/today">
            <TodayPage />
          </Route>
          <Route exact path="/progress">
            <ProgressPage />
          </Route>
          <Route exact path="/">
            <Redirect to="/today" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom" className="custom-tab-bar">
          <IonTabButton tab="today" href="/today" className="custom-tab-button">
            <div className="tab-indicator">
              <IonIcon aria-hidden="true" icon={flash} className="tab-icon-active" />
              <IonIcon aria-hidden="true" icon={flashOutline} className="tab-icon-inactive" />
              <IonLabel className="tab-label">Today</IonLabel>
            </div>
          </IonTabButton>
          
          <IonTabButton tab="progress" href="/progress" className="custom-tab-button">
            <div className="tab-indicator">
              <IonIcon aria-hidden="true" icon={barChart} className="tab-icon-active" />
              <IonIcon aria-hidden="true" icon={barChartOutline} className="tab-icon-inactive" />
              <IonLabel className="tab-label">Progress</IonLabel>
            </div>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
    );
};

export default App;
