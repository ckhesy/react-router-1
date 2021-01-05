import React from "react";
import { __RouterContext as RouterContext } from "react-router";
import PropTypes from "prop-types";
import invariant from "tiny-invariant";
import {
  resolveToLocation,
  normalizeToLocation
} from "./utils/locationUtils.js";

// React 15 compat
const forwardRefShim = C => C;
let { forwardRef } = React;
if (typeof forwardRef === "undefined") {
  forwardRef = forwardRefShim;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
// LinkAnchor只是渲染了一个没有默认行为的a标签
// 跳转行为由传进来的navigate实现
const LinkAnchor = forwardRef(
  (
    {
      innerRef, // TODO: deprecate
      navigate,
      onClick,
      ...rest
    },
    forwardedRef
  ) => {
    const { target } = rest;

    let props = {
      ...rest,
      onClick: event => {
        try {
          if (onClick) onClick(event);
        } catch (ex) {
          event.preventDefault();
          throw ex;
        }

        if (
          !event.defaultPrevented && // onClick prevented default
          event.button === 0 && // 点击事件为鼠标左键; ignore everything but left clicks
          (!target || target === "_self") && // _target不存在, 或者_target为_selflet browser handle "target=_blank" etc.
          !isModifiedEvent(event) // 点击事件发生时未有其他按键同时按住; ignore clicks with modifier keys
        ) {
          event.preventDefault(); // 阻止超链接默认事件, 避免点击<Link>后重新刷新页面;
          navigate();
        }
      }
    };

    // React 15 compat
    if (forwardRefShim !== forwardRef) {
      props.ref = forwardedRef || innerRef;
    } else {
      props.ref = innerRef;
    }

    /* eslint-disable-next-line jsx-a11y/anchor-has-content */
    return <a {...props} />;
  }
);

if (__DEV__) {
  LinkAnchor.displayName = "LinkAnchor";
}

/**
 * The public API for rendering a history-aware <a>.
 */
const Link = forwardRef(
  (
    {
      component = LinkAnchor,
      replace,
      to,
      innerRef, // TODO: deprecate
      ...rest
    },
    forwardedRef
  ) => {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Link> outside a <Router>");

          const { history } = context; // 从RouterContext获取history对象

          const location = normalizeToLocation(
            resolveToLocation(to, context.location),
            context.location
          );

          const href = location ? history.createHref(location) : "";
          const props = {
            ...rest,
            href,
            navigate() {
              // navigate从<Link>源码中可以看到, 主要是通过传入的replace属性判断跳转类型,
              // 根据对应跳转类型选择history.replace或是history.push进行路由跳转:
              const location = resolveToLocation(to, context.location);
              const method = replace ? history.replace : history.push;

              method(location);
            }
          };

          // React 15 compat
          if (forwardRefShim !== forwardRef) {
            props.ref = forwardedRef || innerRef;
          } else {
            props.innerRef = innerRef;
          }

          return React.createElement(component, props);
        }}
      </RouterContext.Consumer>
    );
  }
);

if (__DEV__) {
  const toType = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.func
  ]);
  const refType = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]);

  Link.displayName = "Link";

  Link.propTypes = {
    innerRef: refType,
    onClick: PropTypes.func,
    replace: PropTypes.bool, // //默认值是false，如果是真的，点击这个链接将会取代历史堆栈中的当前条目，而不是添加一个新的条目。
    target: PropTypes.string,
    to: toType.isRequired ////可能是字符串，可能是对象。
    //如果是对象可以包含 to={{
    // pathname: '/courses',
    // search: '?sort=name',
    // hash: '#the-hash',
    // state: { fromDashboard: true }
    //}}
  };
}
// Link 组件最终会渲染为 HTML 标签 <a>，它的 to、query、hash 属性会被组合在一起并渲染为 href 属性。虽然 Link 被渲染为超链接，但在内部实现上使用脚本拦截了浏览器的默认行为，然后调用了history.pushState 方法
export default Link;
