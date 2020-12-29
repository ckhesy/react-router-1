import React from "react";
import PropTypes from "prop-types";
import { createLocation, locationsAreEqual } from "history";
import invariant from "tiny-invariant";

import Lifecycle from "./Lifecycle.js";
import RouterContext from "./RouterContext.js";
import generatePath from "./generatePath.js";

/**
 * The public API for navigating programmatically with a component.
 */
function Redirect({ computedMatch, to, push = false }) {
  return (
    <RouterContext.Consumer>
      {context => {
        invariant(context, "You should not use <Redirect> outside a <Router>");

        const { history, staticContext } = context;
        // 首先通过传入的push确定<Redirect>的跳转方式是push还是replace:
        const method = push ? history.push : history.replace;
        // 接着确定跳转的location: createLocation为history库的方法, 会根据传入的参数创建一个location对象:
        const location = createLocation(
          // 当<Redirect>作为<Switch>的子组件并被匹配时, <Switch>将会将匹配计算得出的computedMatch传给<Redirect>
          computedMatch
            ? typeof to === "string"
              ? generatePath(to, computedMatch.params) // generatePath是react-router提供的一个api, 用于将path和parameters组合生成一个pathname
              : {
                  ...to,
                  pathname: generatePath(to.pathname, computedMatch.params)
                }
            : to
        );
        
        // When rendering in a static context,
        // set the new location immediately.
        if (staticContext) {
          method(location);
          return null;
        }
       // <Lifecycle>组件结构非常简单, 支持传入onMount, onUpdate以及onUnmount三个方法, 分别代表着componentDidMount, componentDidUpdate, componentWillUnmount;
        return (
          <Lifecycle
          // <Redirect>在componentDidMount生命周期中进行push/replace跳转;
            onMount={() => {
              method(location);
            }}
            // 在componentDidUpdate生命周期中使用history库的locationsAreEqual方法, 比较上一个location和新的location是否相同, 若是location不相同, 则执行push/replace跳转事件;
            onUpdate={(self, prevProps) => {
              const prevLocation = createLocation(prevProps.to);
              if (
                !locationsAreEqual(prevLocation, {
                  ...location,
                  key: prevLocation.key
                })
              ) {
                method(location);
              }
            }}
            to={to}
          />
        );
      }}
    </RouterContext.Consumer>
  );
}

if (__DEV__) {
  Redirect.propTypes = {
    push: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
  };
}

export default Redirect;
