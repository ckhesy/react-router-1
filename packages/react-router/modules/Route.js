import React from "react";
import { isValidElementType } from "react-is";
import PropTypes from "prop-types";
import invariant from "tiny-invariant";
import warning from "tiny-warning";

import RouterContext from "./RouterContext.js";
import matchPath from "./matchPath.js";

function isEmptyChildren(children) {
  return React.Children.count(children) === 0;
}

function evalChildrenDev(children, props, path) {
  const value = children(props);

  warning(
    value !== undefined,
    "You returned `undefined` from the `children` function of " +
      `<Route${path ? ` path="${path}"` : ""}>, but you ` +
      "should have returned a React element or `null`"
  );

  return value || null;
}

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Route> outside a <Router>");
          // computedMatch是route包裹了Switch组件才会true，等会介绍switch的时候会讲到
          // 当前Route如果没有传入path参数，那么将命中路径‘/’，无论如何都显示
          // 若Route 有path参数，那么就用matchPath函数来决定是否命中路由
          const location = this.props.location || context.location;
          const match = this.props.computedMatch
            ? this.props.computedMatch // <Switch> already computed the match for us
            : this.props.path
            ? matchPath(location.pathname, this.props)
            : context.match;

          const props = { ...context, location, match };

          let { children, component, render } = this.props;

          // Preact uses an empty array as children by
          // default, so use null if that's the case.
          if (Array.isArray(children) && isEmptyChildren(children)) {
            children = null;
          }
                // 为什么要包裹这一层RouterContext.Provider呢？？？？
          // 如果当前Route命中了当前路由，那么match将不为null
          // 检查 当前Route的子组件是class还是函数组件，进行不同的处理
          // 如果当前route没子组件，那么将检查是否传入component参数或者render参数，进行不同处理
          return (
            <RouterContext.Provider value={props}>
              {props.match
                ? children
                  ? typeof children === "function"
                    ? __DEV__
                      ? evalChildrenDev(children, props, this.props.path)
                      : children(props)
                    : children
                  : component
                  ? React.createElement(component, props)
                  : render
                  ? render(props)
                  : null
                : typeof children === "function"
                ? __DEV__
                  ? evalChildrenDev(children, props, this.props.path)
                  : children(props)
                : null}
            </RouterContext.Provider>
          );
        }}
      </RouterContext.Consumer>
    );
  }
}

if (__DEV__) {
  Route.propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    component: (props, propName) => {
      if (props[propName] && !isValidElementType(props[propName])) {
        return new Error(
          `Invalid prop 'component' supplied to 'Route': the prop is not a valid React component`
        );
      }
    },
    exact: PropTypes.bool,
    location: PropTypes.object,
    path: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    render: PropTypes.func,
    sensitive: PropTypes.bool,
    strict: PropTypes.bool
  };

  Route.prototype.componentDidMount = function() {
    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.component
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route component> will be ignored"
    );

    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.render
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route render> will be ignored"
    );

    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );
  };

  Route.prototype.componentDidUpdate = function(prevProps) {
    warning(
      !(this.props.location && !prevProps.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!this.props.location && prevProps.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  };
}

export default Route;
