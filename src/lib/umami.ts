const UmamiTrack = (
  event_name: string,
  payload?: { [key: string]: string },
) => {
  //@ts-expect-error umami is loaded on client
  umami.track(event_name, payload);
};

export default UmamiTrack;
