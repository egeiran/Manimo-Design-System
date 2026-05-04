function LessonSummary() {
  return (
    <div className="summary">
      <h3 className="section-title">In this lesson</h3>
      <p>
        When you connect a battery to a capacitor through a resistor, the capacitor doesn't charge instantly — it eases toward the source voltage along an exponential curve. The shape of that curve is governed entirely by a single number: the <em>time constant</em>, written <em>τ</em> (tau).
      </p>
      <div className="eq-block">
        τ <span className="op">=</span> R · C
      </div>
      <p>
        After one time constant, the capacitor has reached about 63% of its final voltage. After three, it's past 95%. After five, you can reasonably call it "fully charged." Manimo walks through the differential equation, the intuition behind the 63%, and what changes if you swap the resistor.
      </p>
      <p>
        Drawn from Eldhuset's notes on <em>RC-krets</em> in TFY4125 §4.3.6.
      </p>
    </div>
  );
}
window.LessonSummary = LessonSummary;
