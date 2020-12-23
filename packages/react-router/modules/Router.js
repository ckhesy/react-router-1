import React from "react";
import PropTypes from "prop-types";
import warning from "tiny-warning";

import HistoryContext from "./HistoryContext.js";
import RouterContext from "./RouterContext.js";

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static computeRootMatch(pathname) {
    return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
  }
// ====== constructor周期内监听history的路由事件，将新的location存到Router的state中
  constructor(props) {
    super(props);

    this.state = {
      location: props.history.location
    };
    // 为了防止此时有<Redirect>,是防御性代码，是一种hack的做法，防止组件还没渲染location就变了
    // 如果location发生变化，但是当前组件还没有渲染出来，就放到临时的peddng变量中去，下次等渲染了，再设置到state上
    // This is a bit of a hack. We have to start listening for location
    // changes here in the constructor in case there are any <Redirect>s
    // on the initial render. If there are, they will replace/push when
    // they mount and since cDM fires in children before parents, we may
    // get a new location before the <Router> is mounted.
    this._isMounted = false;
    this._pendingLocation = null;
    // if (!props.staticContext) {}的作用，是保证Router里面再嵌套Router时，使用的是相同的history
    if (!props.staticContext) {
      this.unlisten = props.history.listen(location => {
        if (this._isMounted) {
          this.setState({ location });
        } else {
          this._pendingLocation = location;
        }
      });
    }
  }

  componentDidMount() {
    this._isMounted = true;

    if (this._pendingLocation) {
      this.setState({ location: this._pendingLocation });
    }
  }
  // ==== componentWillUnmount移除监听
  componentWillUnmount() {
    if (this.unlisten) {
      this.unlisten();
      this._isMounted = false;
      this._pendingLocation = null;
    }
  }
// ===== 使用Context包裹子组件（Provider），存入history、location、match(默认的命中对象)等。
  render() {
    return (
      <RouterContext.Provider
        value={{
          history: this.props.history, // history实例传入context中
          location: this.state.location, // 当前页面的location状态传入context
          match: Router.computeRootMatch(this.state.location.pathname), // match当前命中的路由规则
          staticContext: this.props.staticContext
        }}
      >
        <HistoryContext.Provider
          children={this.props.children || null}
          value={this.props.history}
        />
      </RouterContext.Provider>
    );
  }
}

if (__DEV__) {
  Router.propTypes = {
    children: PropTypes.node,
    history: PropTypes.object.isRequired,
    staticContext: PropTypes.object
  };

  Router.prototype.componentDidUpdate = function(prevProps) {
    warning(
      prevProps.history === this.props.history,
      "You cannot change <Router history>"
    );
  };
}

export default Router;

/// 从源码知道，Router 组件设置了一个 location 的 state ，
// 并且把 history ，location 注入 RouterContext。history 和子组件(就是Route)组件注入HistoryContext 。
// 并且监听 location 的变化 props.history.listen(() => { // 改变location })。
