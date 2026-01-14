"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";

const ValidationAlert = ({ msg }: { msg: string }) => {
  if (msg === "") {
    return null;
  }
  return (
    <div className="flex items-center space-x-1 text-sm font-bold text-rose-400">
      <FontAwesomeIcon icon={faCircleExclamation} className="mr-0.5" />
      <div>{msg}</div>
    </div>
  );
};

export default ValidationAlert;
