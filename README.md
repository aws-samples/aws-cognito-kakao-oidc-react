## AWS APJ Startup Samples

Welcome. This repository has been prepared by Startup Solution Architects in AWS APJ to help startups easily discover additional resources, including sample code, workshops, and demos.

We hope this repository helps you navigate the available options and maximize the value of running on AWS. As always, if you have any questions, please don't hesitate to contact your local AWS startup team. If you're not already connected with them, you can reach out here:
https://aws.amazon.com/startups/contact-us


## How to use this repository

This repository is large and contains many projects, making it a monorepo.  
To save time and disk space, we recommend cloning only the directories you need rather than downloading the entire repository.

You can do this using `git sparse-checkout`.

For example, if you want to clone the `agentic-workloads/sample-1` project, run:

   ```
   git clone https://github.com/aws-samples/sample-apj-sup-sa.git
   cd sample-apj-sup-sa
   git sparse-checkout init --cone
   git sparse-checkout set agentic-workloads/sample-1
   ```

For more details on `git sparse-checkout`, see:
https://github.blog/2020-01-17-bring-your-monorepo-down-to-size-with-sparse-checkout/


## License

This library is licensed under the MIT-0 License. See the LICENSE file for details.
