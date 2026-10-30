"use client";

import { useLayoutEffect } from "react";

import { isRobotView } from "@/components/common/robot-view";
import { usePreloader } from "@/hooks/use-preloader";

/*
 * The robot form (D-016) has no preloader, and the preloader is what marks the
 * page ready and revealed — the hero's reveals wait on it. Raise both here: at
 * module evaluation when the server's robot marker is present, and before
 * paint. Renders nothing.
 */
const raise = () => {
  usePreloader.getState().markReady();
  usePreloader.getState().reveal();
};

if (isRobotView()) raise();

export const RobotReady = (): null => {
  useLayoutEffect(raise, []);
  return null;
};
