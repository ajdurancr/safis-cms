import * as React from 'react'
import safisLogo from '../images/icon.png'
import * as styles from './index.module.sass'
import '@fontsource/inter'

const NotFound: React.FC = () => (
  <main className={styles.pageStyles}>
    <title>404</title>
    <img className={styles.logoStyles} alt="Safis Logo" src={safisLogo} />
    <h1 className={styles.headingStyles}>404 Safis</h1>
  </main>
)

export default NotFound
