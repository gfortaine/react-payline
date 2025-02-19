import React, { useInsertionEffect, useState, ReactNode } from 'react';

type PropsType = {
  production?: boolean;
  children?: ReactNode;
};

const PaylineProvider: React.ComponentType<PropsType> = ({ production = false, children }) => {
  let initialState = false;
  if (typeof window !== 'undefined') {
      initialState = window.Payline !== undefined;
  }
  const baseUrl = production ? 'https://payment.cdn.payline.com/cdn' : 'https://homologation-payment.cdn.payline.com/cdn';

  // add script
  const scriptUrl = `${baseUrl}/scripts/widget-min.js`;
  const [, setIsLoaded] = useState(initialState);
  useInsertionEffect(() => {
    let script: HTMLScriptElement | null = document.querySelector(`script[src="${scriptUrl}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = scriptUrl;
      document.head.appendChild(script);
    }

    const onLoad = () => setIsLoaded(true);

    script.addEventListener('load', onLoad, false);
    return () => {
      if (script) script.removeEventListener('load', onLoad, false);
    };
  }, [scriptUrl]);

  // add stylesheet
  const stylesheetUrl = `${baseUrl}/styles/widget-min.css`;
  useInsertionEffect(() => {
    let stylesheet: HTMLLinkElement | null = document.querySelector(`link[href="${stylesheetUrl}"]`);
    if (!stylesheet) {
      stylesheet = document.createElement('link');
      stylesheet.href = stylesheetUrl;
      stylesheet.rel = 'stylesheet';
      document.head.appendChild(stylesheet);
    }
  }, [stylesheetUrl]);

  // https://stackoverflow.com/a/44050222
  const css = `
    #PaylineWidget #pl-mgr-paymentMethodList-layout .pl-paymentMethodLayout-view:not(:first-child) {
      display: none;
    }
    
    #PaylineWidget span.pl-card-logo.pl-custom {
      background-image: initial;
    }
  `;

  // render children
  return (
    <>
      <style>{css}</style>
      {children}
    </>
  );
};

export default PaylineProvider;
