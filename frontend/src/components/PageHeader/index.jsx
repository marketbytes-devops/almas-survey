import React from 'react';

const PageHeader = ({ title, subtitle, extra }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left items-center">
            <div className="w-full md:w-auto">
                <h1 className="text-2xl font-medium text-[#4c7085] tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {extra && (
                <div className="w-full md:w-auto">
                    {extra}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
