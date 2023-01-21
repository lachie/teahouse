import { IncomingMessage } from "http";
import React from "react";

export type HostSpec = {
  api: string
}

export type HostSpecProps = { host: HostSpec }

export const HostContext = React.createContext<HostSpec>({api: ''});

export function getHostFromReq(req?: IncomingMessage): HostSpec {
    let host;
    if (req !== undefined && req.url && req.headers.host) {
      [host] = req.headers.host.split(":");
    } else {
      host = window.location.hostname;
    }

    return { api: `http://${host}:3030` }
  };