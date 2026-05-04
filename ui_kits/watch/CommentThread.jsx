function CommentThread() {
  return (
    <div className="comments">
      <h3 className="section-title">Discussion · 18</h3>
      <div className="composer-row">
        <div className="av">Y</div>
        <textarea placeholder="Ask a question, or share what clicked for you…"/>
      </div>
      <Comment av="1" name="Mira H." time="3 hours ago" text="The 63% never made intuitive sense to me until you showed it as the area under e^(-t/RC) — that single reframe was worth the whole lesson." likes={42} replies={3}/>
      <Comment av="2" name="Jonas T." time="1 day ago" text="Question: does the same τ = RC argument work in reverse for discharging? I think the curve flips but the time constant is identical. Manimo, can you confirm?" likes={11} replies={1}/>
      <Comment av="3" name="Sara N." time="1 day ago" text="Excellent pacing. The pause before showing the τ derivation — let me predict it — was so much better than just dumping the formula." likes={88} replies={5}/>
    </div>
  );
}

function Comment({ av, name, time, text, likes, replies }) {
  return (
    <div className="comment">
      <div className={`av av-${av}`}>{name[0]}</div>
      <div className="comment-body">
        <div className="comment-head">
          <span className="comment-name">{name}</span>
          <span className="comment-time">{time}</span>
        </div>
        <div className="comment-text">{text}</div>
        <div className="comment-actions">
          <button>♥ {likes}</button>
          <button>Reply</button>
          {replies > 0 && <button style={{ color: 'var(--amber-300)' }}>{replies} replies</button>}
        </div>
      </div>
    </div>
  );
}
window.CommentThread = CommentThread;
