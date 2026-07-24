import { IoMdCheckmark } from "react-icons/io";

type Props = {
  active: number;
  setActive: (active: number) => void;
};

const CourseOptions = ({ active, setActive }: Props) => {
  // List of step names for the course creation process
  const options = [
    "Course Information",
    "Course Data",
    "Course Content",
    "Course Preview",
  ];

  return (
    <div>
      {options.map((option, index) => (
        <div
          key={index}
          className={`w-full m-3.25 800px:m-0 800px:flex py-5`}
          onClick={() => setActive(index)}
        >
          <div
            className={`w-8.75 h-8.75  rounded-full  flex items-center justify-center ${
              active + 1 > index ? "bg-blue-500" : "bg-[#384766]"
            } relative`}
          >
            <IoMdCheckmark className=" text-[25px]" />
            {index !== options.length - 1 && (
              <>
                <div
                  className={`absolute hidden 800px:block h-16.25 w-1   ${
                    active + 1 > index ? "bg-blue-500" : "bg-[#384766]"
                  } bottom-[-150%]  `}
                />
                <div
                  className={`absolute 800px:hidden h-0.5  w-15 ${
                    active + 1 > index ? "bg-blue-500" : "bg-[#384766]"
                  } top-[50%] bottom-full left-full   `}
                />
              </>
            )}
          </div>
          <h5
            className={`p-3 800px:pl-3 ${
              active === index
                ? "dark:text-white text-black"
                : "dark:text-white text-black"
            } text-[10px] 800px:text-[20px]`}
          >
            {option}
          </h5>
        </div>
      ))}
    </div>
  );
};

export default CourseOptions;