// Top-level composition of the portfolio page.

function App() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
    className: "skip-link",
    href: "#main-content"
  }, "Skip to main content"), /*#__PURE__*/React.createElement(Runner, null), /*#__PURE__*/React.createElement("main", {
    id: "main-content"
  }, /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(Ticker, null), /*#__PURE__*/React.createElement(About, null), /*#__PURE__*/React.createElement("div", {
    id: "morph"
  }, /*#__PURE__*/React.createElement(MorphStage, null)), /*#__PURE__*/React.createElement(Ticker, null), /*#__PURE__*/React.createElement(Projects, null), /*#__PURE__*/React.createElement(Services, null), /*#__PURE__*/React.createElement(Writing, null), /*#__PURE__*/React.createElement(Contact, null)), /*#__PURE__*/React.createElement(CursorTrail, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));