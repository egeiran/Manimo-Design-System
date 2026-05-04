function WatchTopBar() {
  return (
    <header className="w-topbar">
      <div className="left">
        <a href="#" className="brand">
          <img src="../../assets/manimo-mark.svg" alt=""/>
          <span className="brand-word">Manimo</span>
        </a>
        <div className="w-search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search lessons, topics, authors…"/>
        </div>
      </div>
      <div className="right">
        <button className="btn btn-ghost btn-sm">Browse</button>
        <button className="btn btn-secondary btn-sm">Sign in</button>
        <button className="btn btn-primary btn-sm">Create a lesson</button>
      </div>
    </header>
  );
}
window.WatchTopBar = WatchTopBar;
