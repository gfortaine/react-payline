import React, { useRef, useEffect } from 'react';

type StateType =
  | 'ACTIVE_WAITING'
  | 'BROWSER_NOT_SUPPORTED'
  | 'MANAGE_WEB_WALLET'
  | 'PAYMENT_CANCELED_WITH_RETRY'
  | 'PAYMENT_CANCELED'
  | 'PAYMENT_FAILURE_WITH_RETRY'
  | 'PAYMENT_FAILURE'
  | 'PAYMENT_METHOD_NEEDS_MORE_INFOS'
  | 'PAYMENT_METHODS_LIST_SHORTCUT'
  | 'PAYMENT_METHODS_LIST'
  | 'PAYMENT_ONHOLD_PARTNER'
  | 'PAYMENT_REDIRECT_NO_RESPONSE'
  | 'PAYMENT_SUCCESS_FORCE_TICKET_DISPLAY'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_TRANSITIONAL_SHORTCUT'
  | 'TOKEN_EXPIRED';

export type WillInitHandler = () => void;
export type WillShowHandler = () => void;
export type FinalStateHasBeenReachedHandler = (data: { state: StateType }) => false | void;
export type DidShowStateHandler = (data: { state: StateType }) => void;
export type WillDisplayMessageHandler = (data: {
  id: string;
  type: 'success' | 'info' | 'error' | 'warn';
  key: string;
  message: string;
}) => boolean | void;
export type WillRemoveMessageHandler = (data: { id: string }) => boolean | void;
export type BeforePaymentHandler = () => boolean | void;

type PropsType = {
  token: string;
  template?: string;
  embeddedRedirectionAllowed?: boolean;
  partnerReturnUrl?: string;
  orderId?: string;
  redirectUrl?: string;
  instantPayment?: 'EXPECTED' | 'USER_CHOICE' | 'NO';
  bic?: string;

  onWillInit?: WillInitHandler;
  onWillShow?: WillShowHandler;
  onFinalStateHasBeenReached?: FinalStateHasBeenReachedHandler;
  onDidShowState?: DidShowStateHandler;
  onWillDisplayMessage?: WillDisplayMessageHandler;
  onWillRemoveMessage?: WillRemoveMessageHandler;
  onBeforePayment?: BeforePaymentHandler;
} & React.HTMLAttributes<HTMLDivElement>;

const PaylineWidget: React.ComponentType<PropsType> = ({
  token,
  template = 'column',
  embeddedRedirectionAllowed = false,
  partnerReturnUrl,
  orderId,
  redirectUrl,
  instantPayment = 'NO',
  bic,
  onWillInit,
  onWillShow,
  onFinalStateHasBeenReached,
  onDidShowState,
  onWillDisplayMessage,
  onWillRemoveMessage,
  onBeforePayment,
  ...htmlAttributes
}) => {
  const eventHandlers = {
    onWillInit,
    onWillShow,
    onFinalStateHasBeenReached,
    onDidShowState,
    onWillDisplayMessage,
    onWillRemoveMessage,
    onBeforePayment,
  };
  const eventHandlersRef = useRef(eventHandlers);
  eventHandlersRef.current = eventHandlers;

  type EventHandlerNames = Array<keyof typeof eventHandlers>;

  useEffect(() => {
    const propNames = Object.keys(eventHandlersRef.current) as EventHandlerNames;

    propNames.forEach((propName) => {
      (window as any)[`Payline_${propName}`] = (...args: any) => {
        const eventHandler = eventHandlersRef.current[propName] as Function | undefined;
        if (eventHandler) {
          return eventHandler(...args);
        }
        return true;
      };
    });

    return () => {
      propNames.forEach((propName) => {
        delete (window as any)[`Payline_${propName}`];
      });
    };
  }, []);

  useEffect(() => {
    if (token) {
      window.Payline?.Api.init(token, template); // https://support.payline.com/hc/fr/articles/360018691239-Comment-r%C3%A9initialiser-le-widget-payline-
      return () => window.Payline?.Api.hide();
    }
  }, [token]);

  useEffect(() => {
    // https://docs.monext.fr/pages/viewpage.action?pageId=747146983
    if (orderId) {
      window.RIBPayInit = () => {
        const transform = () => {
          const dataAttributes = {
            order_id: orderId,
            redirect_url: redirectUrl,
            instant_payment: instantPayment,
            bic,
          };

          return Object.entries(dataAttributes)
            .reduce((prev, curr): any => {
              if (curr[1]) return [...prev, `data-${curr[0]}=${curr[1]}`];
              return prev;
            }, [])
            .join(" ");
        };
        const html = `
          <link href="https://unpkg.com/@ribpay/widget@~0.2.30/build/static/css/widget-min.css" rel="stylesheet" />
          <script src="https://unpkg.com/@ribpay/widget@~0.2.30/build/static/js/widget-min.js"></script>
          <div id="RIBPayWidget" ${transform()}></div>
        `;

        return [
          {
            index: 0,
            paymentMethodId: "RIBPay",
            html,
          },
        ];
      };
    }
  }, [orderId]);

  return (
    <div
      data-auto-init={!!token}
      data-token={token}
      data-template={template}
      data-embeddedredirectionallowed={embeddedRedirectionAllowed}
      data-partnerreturnurl={partnerReturnUrl}
      data-event-willinit="Payline_onWillInit"
      data-event-willshow="Payline_onWillShow"
      data-event-finalstatehasbeenreached="Payline_onFinalStateHasBeenReached"
      data-event-didshowstate="Payline_onDidShowState"
      data-event-willdisplaymessage="Payline_onWillDisplayMessage"
      data-event-willremovemessage="Payline_onWillRemoveMessage"
      data-event-beforepayment="Payline_onBeforePayment"
      {...htmlAttributes}
      id="PaylineWidget"
      data-custompm="RIBPayInit"
    />
  );
};

export default PaylineWidget;
