import React from "react";
import { Router } from "react-router";
import { createHashHistory as createHistory } from "history";
import PropTypes from "prop-types";
import warning from "tiny-warning";

/**
 * The public API for a <Router> that uses window.location.hash.
 */
class HashRouter extends React.Component {
  history = createHistory(this.props);
  // 这里我们知道，HashRouter 是一个高阶组件，本质是返回 react-router 的 Router 组件。
  // 并且通过history 库创建一个history 实例 和子组件内容一并传入了 Router 组件中。
  // 整个React Router 的 history实例都是来自这里。
  render() {
    return <Router history={this.history} children={this.props.children} />;
  }
}

if (__DEV__) {
  HashRouter.propTypes = {
    basename: PropTypes.string,
    children: PropTypes.node,
    getUserConfirmation: PropTypes.func,
    hashType: PropTypes.oneOf(["hashbang", "noslash", "slash"])
  };

  HashRouter.prototype.componentDidMount = function() {
    warning(
      !this.props.history,
      "<HashRouter> ignores the history prop. To use a custom history, " +
        "use `import { Router }` instead of `import { HashRouter as Router }`."
    );
  };
}

export default HashRouter;
