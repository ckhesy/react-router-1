import React from "react";
import PropTypes from "prop-types";
import hoistStatics from "hoist-non-react-statics";
import invariant from "tiny-invariant";

import RouterContext from "./RouterContext.js";

/**
 * A public higher-order component to access the imperative API
 */
// withRouter是一个高阶组件, 支持传入一个组件, 返回一个能访问路由数据的路由组件, 
// 实质上是将组件作为<RouterContext.Consumer>的子组件, 并将context的路由信息作为props注入组件中;
function withRouter(Component) {
  const displayName = `withRouter(${Component.displayName || Component.name})`;
  const C = props => {
    const { wrappedComponentRef, ...remainingProps } = props;

    return (
      <RouterContext.Consumer>
        {context => {
          invariant(
            context,
            `You should not use <${displayName} /> outside a <Router>`
          );
          return (
            <Component
              {...remainingProps}
              {...context}
              ref={wrappedComponentRef}
            />
          );
        }}
      </RouterContext.Consumer>
    );
  };

  C.displayName = displayName;
  C.WrappedComponent = Component;

  if (__DEV__) {
    C.propTypes = {
      wrappedComponentRef: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func,
        PropTypes.object
      ])
    };
  }

  return hoistStatics(C, Component);
}
/**
 * hoistStatics是三方库hoist-non-react-statics, 用于解决高阶组件中原组件static丢失的问题; 
 * 同时使用支持传入props: wrappedComponentRef, wrappedComponentRef绑定原组件的ref, 
 * 因此可以通过wrappedComponentRef访问到原组件; 
 * 需要注意的是, 函数式组件没有ref, 因为函数式组件并没有实例, 所以使用withRouter包裹函数式组件时, 不支持使用wrappedComponentRef访问原组件!
 */
export default withRouter;
