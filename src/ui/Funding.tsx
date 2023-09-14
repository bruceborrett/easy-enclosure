import GitHubButton from 'react-github-btn'

export const Funding = () => {
  return (
    <div className="funding">
      <a href="https://github.com/sponsors/bruceborrett" target="_blank" rel="noreferrer">
        <img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" alt="Sponsor" height="50" width="217" />
      </a>
      <a href="https://www.buymeacoffee.com/bruceborrett" target="_blank" rel="noreferrer">
        <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="50" width="217" style={{borderRadius: "4px"}} />
      </a>
      <GitHubButton href="https://github.com/bruceborrett/easy-enclosure" data-size="large" data-show-count="true" aria-label="Star bruceborrett/easy-enclosure on GitHub">
        Star
      </GitHubButton>
    </div>
  )
}