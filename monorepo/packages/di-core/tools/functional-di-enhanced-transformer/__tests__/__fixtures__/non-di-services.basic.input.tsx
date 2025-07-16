import React from 'react';

export function NonDIServices(props: {
  data: any;
  services: {
    api: ApiService; // No Inject wrapper
    logger: LoggerService; // No Inject wrapper
  };
}) {
  React.useEffect(() => {
    props.services.api.getData();
    props.services.logger.log('Data loaded');
  }, []);

  return <div>Non-DI services</div>;
}
